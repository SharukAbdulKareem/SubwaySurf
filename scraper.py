from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException, NoSuchElementException
from selenium.webdriver.common.keys import Keys
from bs4 import BeautifulSoup
from pydantic import BaseModel
from typing import List
import time
import googlemaps
import os
from dotenv import load_dotenv
from supabase import create_client, Client
from backend.config import Config

# Load environment variables
load_dotenv()
Config.validate()  # Validate all required env vars are present

# Initialize Google Maps client
gmaps = googlemaps.Client(key=Config.GOOGLE_MAPS_API_KEY)

# Initialize Supabase client
supabase: Client = create_client(Config.SUPABASE_URL, Config.SUPABASE_KEY)

# Define Pydantic models
class Outlet(BaseModel):
    name: str
    address: str
    operating_hours: str
    waze_link: str

class Outlets(BaseModel):
    outlets: List[Outlet]

def scrape_subway_outlets():
    # Set up Selenium WebDriver
    driver = webdriver.Chrome(service=Service(ChromeDriverManager().install()))
    driver.get("https://subway.com.my/find-a-subway")
    time.sleep(3)  # Initial wait for page load

    # Attempt to find the search bar and submit
    try:
        search_box = WebDriverWait(driver, 10).until(
            EC.presence_of_element_located((By.ID, "fp_searchAddress"))
        )
        print("Found search box with selector: By.ID:fp_searchAddress")

        # Interact with the search bar
        search_box.clear()
        search_box.send_keys("Kuala Lumpur")

        # Click the search button
        search_button = driver.find_element(By.ID, "fp_searchAddressBtn")
        search_button.click()
        WebDriverWait(driver, 10).until(
            EC.presence_of_element_located((By.CLASS_NAME, "fp_listitem"))
        )
        time.sleep(2)  # Additional wait for results to load
    except TimeoutException as e:
        print(f"Error filtering by Kuala Lumpur: Timeout waiting for outlets. Element with class 'fp_listitem' not found. {e}")
        # Debug: Log the page HTML to inspect available elements
        soup = BeautifulSoup(driver.page_source, "html.parser")
        print("Available div elements on the page:")
        divs = soup.find_all("div")
        for div in divs[:10]:  # Print first 10 divs for brevity
            print(div)
        driver.quit()
        return None
    except Exception as e:
        print(f"Error filtering by Kuala Lumpur: {e}")
        driver.quit()
        return None

    # Parse the page with BeautifulSoup
    soup = BeautifulSoup(driver.page_source, "html.parser")
    outlets = []
    outlet_elements = soup.find_all("div", class_="fp_listitem")

    for i, outlet_elem in enumerate(outlet_elements):
        try:
            # Extract name (using <h4> tag)
            name = outlet_elem.find("h4").text.strip() if outlet_elem.find("h4") else "Unknown"

            # Extract address and operating hours from infoboxcontent
            infobox = outlet_elem.find("div", class_="infoboxcontent")
            p_tags = infobox.find_all("p") if infobox else []
            address = p_tags[0].text.strip() if len(p_tags) > 0 else "Unknown"  # First <p> is address

            # Filter for Kuala Lumpur outlets
            if "Kuala Lumpur" not in address:
                continue  # Skip outlets not in Kuala Lumpur

            # Operating hours may span multiple <p> tags (e.g., index 2 and 3)
            operating_hours_parts = []
            if len(p_tags) > 2:
                operating_hours_parts.append(p_tags[2].text.strip())
            if len(p_tags) > 3 and p_tags[3].text.strip():
                operating_hours_parts.append(p_tags[3].text.strip())
            operating_hours = " | ".join(part for part in operating_hours_parts if part) if operating_hours_parts else "Unknown"

            # Extract latitude and longitude from data attributes
            latitude = float(outlet_elem.get("data-latitude", None)) if outlet_elem.get("data-latitude") else None
            longitude = float(outlet_elem.get("data-longitude", None)) if outlet_elem.get("data-longitude") else None

            # Find the Waze button and extract the href
            waze_buttons = driver.find_elements(By.XPATH, "//i[@class='fa-brands fa-waze']/parent::a")
            if i < len(waze_buttons):
                waze_button = waze_buttons[i]
                driver.execute_script("arguments[0].scrollIntoView(true);", waze_button)
                waze_link = waze_button.get_attribute("href")  # Extract href directly
                if not waze_link:  # Fallback: click if href is not available
                    waze_button.click()
                    time.sleep(1)  # Wait for redirection
                    try:
                        WebDriverWait(driver, 5).until(EC.number_of_windows_to_be(2))
                        driver.switch_to.window(driver.window_handles[-1])
                        waze_link = driver.current_url
                        driver.close()  # Close the Waze tab
                        driver.switch_to.window(driver.window_handles[0])  # Switch back to main tab
                    except TimeoutException:
                        waze_link = "Not available (failed to open new tab)"
            else:
                waze_link = "Not available"

            # Add outlet to list
            outlet = Outlet(
                name=name,
                address=address,
                operating_hours=operating_hours,
                waze_link=waze_link,
                latitude=latitude,
                longitude=longitude
            )
            outlets.append(outlet)
            print(f"Scraped outlet: {name}")

        except Exception as e:
            print(f"Error scraping outlet {i+1}: {e}")
            continue

    driver.quit()
    return Outlets(outlets=outlets)

def main():
    # Scrape the outlets
    result = scrape_subway_outlets()

    if result and result.outlets:
        # Convert to dictionary for further processing
        outlets_data = [outlet.model_dump() for outlet in result.outlets]

        # Geocode each outlet's address
        for outlet in outlets_data:
            try:
                geocode_result = gmaps.geocode(outlet['address'])
                if geocode_result:
                    location = geocode_result[0]['geometry']['location']
                    outlet['lat'] = location['lat']
                    outlet['lng'] = location['lng']
                    print(f"Geocoded {outlet['name']}: ({location['lat']}, {location['lng']})")
                else:
                    print(f"Could not geocode address: {outlet['address']}")
                    outlet['lat'] = None
                    outlet['lng'] = None
            except Exception as e:
                print(f"Error geocoding {outlet['address']}: {e}")
                outlet['lat'] = None
                outlet['lng'] = None

        # Insert into Supabase
        try:
            response = supabase.table("outlets").upsert(outlets_data, on_conflict="address").execute()
            print("Data inserted successfully.")
        except Exception as e:
            print(f"Error inserting data: {e}")
    else:
        print("No outlets scraped.")

if __name__ == "__main__":
    main()