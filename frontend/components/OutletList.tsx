import { Outlet } from '@/types';

interface OutletListProps {
  outlets: Outlet[];
}

export default function OutletList({ outlets }: OutletListProps) {
  return (
    <div className="bg-white shadow-lg rounded-lg p-6">
      <h2 className="text-xl font-semibold mb-4">All Outlets in KL</h2>
      <div className="space-y-4 h-[250px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 pr-2">
        {outlets.map((outlet) => (
          <div
            key={outlet.address}
            className="border-b border-gray-200 last:border-0 pb-4"
          >
            <h3 className="font-semibold text-[#006B10]">{outlet.name}</h3>
            <p className="text-sm text-gray-600 mt-1">{outlet.address}</p>
            <p className="text-sm text-gray-500 mt-1">{outlet.operating_hours}</p>
            <a
              href={outlet.waze_link}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-[#006B10] hover:underline mt-2 inline-block"
            >
              Open in Waze →
            </a>
          </div>
        ))}
      </div>
    </div>
  );
} 