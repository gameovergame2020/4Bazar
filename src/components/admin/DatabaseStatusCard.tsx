
import React from 'react';

interface SystemMetrics {
  databaseSize: number;
}

interface DatabaseStatusCardProps {
  metrics: SystemMetrics;
}

const DatabaseStatusCard: React.FC<DatabaseStatusCardProps> = ({ metrics }) => {
  return (
    <div className="bg-white rounded-2xl p-6 border border-gray-100">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Ma'lumotlar bazasi</h3>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-gray-600">Hajmi</span>
          <span className="font-medium text-gray-900">{metrics.databaseSize} GB</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-gray-600">Jadvallar</span>
          <span className="font-medium text-gray-900">12</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-gray-600">Yozuvlar</span>
          <span className="font-medium text-gray-900">45,678</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-gray-600">Oxirgi backup</span>
          <span className="font-medium text-gray-900">2 soat oldin</span>
        </div>
      </div>
    </div>
  );
};

export default DatabaseStatusCard;
