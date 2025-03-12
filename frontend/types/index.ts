export interface Outlet {
  name: string;
  address: string;
  operating_hours: string;
  waze_link: string;
  lat?: number;
  lng?: number;
}

export interface Message {
  type: 'user' | 'bot';
  content: string;
  timestamp: number;
}

export interface SearchResponse {
  answer: string;
  details?: Outlet[];
} 