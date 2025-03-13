import { useState, useEffect } from 'react';
import { Message } from '@/types';

interface ChatInterfaceProps {
  onSearch: (query: string) => Promise<void>;
  loading: boolean;
  searchResult: string | null;
}

export default function ChatInterface({ onSearch, loading, searchResult }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      type: 'bot',
      content: 'Hi! I can help you find information about Subway outlets. What would you like to know?',
      timestamp: Date.now()
    }
  ]);
  const [input, setInput] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage: Message = {
      type: 'user',
      content: input.trim(),
      timestamp: Date.now()
    };
    setInput('');
    setMessages(prev => [...prev, userMessage]);
    
    await onSearch(userMessage.content);
  };

  useEffect(() => {
    if (searchResult) {
      const botMessage: Message = {
        type: 'bot',
        content: searchResult,
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, botMessage]);
    }
  }, [searchResult]);

  // Save messages to localStorage when they change
  useEffect(() => {
    localStorage.setItem('chatHistory', JSON.stringify(messages));
  }, [messages]);

  // Load messages from localStorage on component mount
  useEffect(() => {
    const savedMessages = localStorage.getItem('chatHistory');
    if (savedMessages) {
      setMessages(JSON.parse(savedMessages));
    }
  }, []);

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 h-[600px] flex flex-col">
      <div className="flex-1 overflow-y-auto mb-4 space-y-4 scrollbar-thin scrollbar-thumb-gray-300">
        {messages.map((message) => (
          <div
            key={message.timestamp}
            className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-lg px-4 py-2 ${
                message.type === 'user'
                  ? 'bg-[#006B10] text-white'
                  : 'bg-gray-100 text-gray-800'
              }`}
            >
              {message.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 text-gray-800 rounded-lg px-4 py-2">
              <div className="flex space-x-2">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100" />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200" />
              </div>
            </div>
          </div>
        )}
      </div>
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about Subway outlets..."
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#006B10] 
            bg-white text-gray-800 placeholder-gray-500"
        />
        <button
          type="submit"
          disabled={loading}
          className={`px-6 py-2 bg-[#006B10] text-white rounded-lg hover:bg-[#005209] transition-colors
            ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          Send
        </button>
      </form>
    </div>
  );
} 