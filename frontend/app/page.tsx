'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import OutletList from '@/components/OutletList';
import { Outlet, SearchResponse } from '@/types';
import ChatInterface from '@/components/ChatInterface';
import IntersectionAnalysis from '@/components/IntersectionAnalysis';

const Map = dynamic(() => import('@/components/Map'), {
  ssr: false,
  loading: () => <div className="h-[600px] w-full bg-gray-100 animate-pulse rounded-lg" />
});

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';

export default function Home() {
  const [outlets, setOutlets] = useState<Outlet[]>([]);
  const [searchResult, setSearchResult] = useState<SearchResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchOutlets();
  }, []);

  const fetchOutlets = async () => {
    setIsLoading(true);
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(`${API_URL}/outlets/`, {
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
        }
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      const data = await response.json();
      console.log('Fetched outlets:', data);
      
      if (!Array.isArray(data)) {
        throw new Error('Invalid data format received from server');
      }

      setOutlets(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching outlets:', err);
      if (err instanceof Error) {
        if (err.name === 'AbortError') {
          setError('Request timed out. Please try again later.');
        } else {
          setError(`Failed to load outlets: ${err.message}`);
        }
      } else {
        setError('Failed to load outlets. Please try again later.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async (query: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_URL}/query/?q=${encodeURIComponent(query)}`);
      const data = await response.json();
      setSearchResult(data);
    } catch (err) {
      setError('Search failed. Please try again later.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-[#006B10]">
        <div className="container mx-auto px-4 py-12">
          <div className="flex flex-col items-center text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Subway Surf
            </h1>
            <p className="text-xl text-white/90 max-w-2xl">
              Your ultimate guide to finding Subway restaurants in the heart of Kuala Lumpur
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 -mt-8">
          {/* Left Sidebar - Chat and Outlets */}
          <div className="lg:col-span-4 space-y-8">
            <ChatInterface 
              onSearch={handleSearch} 
              loading={loading} 
              searchResult={searchResult?.answer || null}
            />
            
            {/* Outlet List */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              {isLoading ? (
                <div className="p-4 animate-pulse">
                  <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-24 bg-gray-100 rounded"></div>
                    ))}
                  </div>
                </div>
              ) : (
                <OutletList outlets={outlets} />
              )}
            </div>
          </div>

          {/* Right Content - Map and Analysis */}
          <div className="lg:col-span-8 space-y-8">
            {/* Map */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              {isLoading ? (
                <div className="h-[600px] w-full bg-gray-100 animate-pulse flex items-center justify-center">
                  <p className="text-gray-500">Loading map...</p>
                </div>
              ) : error ? (
                <div className="h-[600px] w-full bg-red-50 flex items-center justify-center">
                  <p className="text-red-500 text-center px-4">{error}</p>
                </div>
              ) : (
                <Map outlets={outlets} />
              )}
            </div>

            {/* Intersection Analysis */}
            {!isLoading && !error && outlets.length > 0 && (
              <IntersectionAnalysis outlets={outlets} />
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-8">
        <div className="container mx-auto px-4 text-center">
          <p className="text-gray-400">© {new Date().getFullYear()} Subway. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
