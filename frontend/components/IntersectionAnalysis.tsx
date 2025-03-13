import { Outlet } from '@/types';
import { PieChart } from 'react-minimal-pie-chart';

interface IntersectionAnalysisProps {
  outlets: Outlet[];
}

export default function IntersectionAnalysis({ outlets }: IntersectionAnalysisProps) {
  // Calculate intersections for each outlet
  const outletIntersections = outlets.map(outlet => {
    if (!outlet.lat || !outlet.lng) return null;
    
    const nearbyOutlets = outlets.filter(other => {
      if (!other.lat || !other.lng) return false;
      if (other === outlet) return false;
      
      // Calculate distance between points using Haversine formula
      const R = 6371; // Earth's radius in km
      const dLat = ((other.lat ?? 0) - (outlet.lat ?? 0)) * Math.PI / 180;
      const dLon = ((other.lng ?? 0) - (outlet.lng ?? 0)) * Math.PI / 180;
      const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos((outlet.lat ?? 0) * Math.PI / 180) * Math.cos((other.lat ?? 0) * Math.PI / 180) * 
        Math.sin(dLon/2) * Math.sin(dLon/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      const distance = R * c;
      
      return distance <= 5; // 5km radius
    });

    return {
      outlet: outlet,
      nearbyCount: nearbyOutlets.length,
      nearbyOutlets: nearbyOutlets
    };
  }).filter(Boolean);

  // Sort outlets by number of nearby outlets (descending)
  outletIntersections.sort((a, b) => b!.nearbyCount - a!.nearbyCount);

  // Group outlets by intersection count for the pie chart
  const groupedCounts = outletIntersections.reduce((acc, data) => {
    if (data) {
      acc[data.nearbyCount] = (acc[data.nearbyCount] || 0) + 1;
    }
    return acc;
  }, {} as Record<number, number>);

  // Prepare data for pie chart
  const pieData = Object.entries(groupedCounts).map(([intersections, count]) => ({
    title: `${intersections} nearby`,
    value: count,
    color: `hsl(${120 + parseInt(intersections) * 30}, 70%, 40%)`
  }));

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <h2 className="text-xl font-semibold mb-4">Outlet Density Analysis</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Pie Chart */}
        <div>
          <h3 className="font-semibold mb-3">Overall Distribution</h3>
          <div className="relative w-4/5 mx-auto">
            <PieChart
              data={pieData}
              labelStyle={{
                fontSize: '4px',
                fontFamily: 'sans-serif',
                fill: '#fff',
              }}
              radius={35}
            />
          </div>
        </div>

        {/* Right side content */}
        <div>
          {/* Grid for Legend and Breakdown side by side */}
          <div className="grid grid-cols-2 gap-4">
            {/* Legend */}
            <div>
              <h3 className="font-semibold mb-3">Distribution Legend</h3>
              <ul className="space-y-1 text-sm">
                {pieData.map((data, i) => (
                  <li key={i} className="flex items-center">
                    <span 
                      className="w-3 h-3 rounded-full mr-2" 
                      style={{ backgroundColor: data.color }}
                    />
                    <span className="text-xs">
                      {data.value} have {data.title}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Detailed Breakdown */}
            <div>
              <h3 className="font-semibold mb-3">Detailed Breakdown</h3>
              <div className="h-[250px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-300">
                {outletIntersections.map((data) => (
                  data && (
                    <div 
                      key={data.outlet.address}
                      className="p-2 mb-2 border border-gray-200 rounded-lg hover:border-[#006B10] transition-colors"
                    >
                      <h4 className="font-semibold text-[#006B10] text-sm">{data.outlet.name}</h4>
                      <p className="text-xs text-gray-600 mt-1">
                        Has {data.nearbyCount} outlet{data.nearbyCount !== 1 ? 's' : ''} within 5km radius
                      </p>
                      {data.nearbyCount > 0 && (
                        <div className="mt-1">
                          <p className="text-xs text-gray-500">Nearby outlets:</p>
                          <ul className="text-xs text-gray-600 mt-1 pl-2">
                            {data.nearbyOutlets.map(nearby => (
                              <li key={nearby.address} className="truncate">
                                • {nearby.name}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 