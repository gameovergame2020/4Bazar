
import React from 'react';

interface SystemMetrics {
  serverLoad: number;
  databaseSize: number;
}

interface ServerStatusCardProps {
  metrics: SystemMetrics;
}

const ServerStatusCard: React.FC<ServerStatusCardProps> = ({ metrics }) => {
  return (
    <div className="bg-white rounded-2xl p-6 border border-gray-100">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Server holati</h3>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-gray-600">CPU yuki</span>
          <span className="font-medium text-gray-900">{metrics.serverLoad}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-500 h-2 rounded-full"
            style={{ width: `${metrics.serverLoad}%` }}
          ></div>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-gray-600">Xotira</span>
          <span className="font-medium text-gray-900">67%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div className="bg-green-500 h-2 rounded-full" style={{ width: '67%' }}></div>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-gray-600">Disk</span>
          <span className="font-medium text-gray-900">34%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div className="bg-yellow-500 h-2 rounded-full" style={{ width: '34%' }}></div>
        </div>
      </div>
    </div>
  );
};

export default ServerStatusCard;
