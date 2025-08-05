
import React from 'react';

const SystemLogsCard: React.FC = () => {
  const logs = [
    { time: '14:32:15', level: 'INFO', message: 'Yangi foydalanuvchi ro\'yhatdan o\'tdi' },
    { time: '14:28:42', level: 'WARN', message: 'Server yuki yuqori' },
    { time: '14:25:18', level: 'INFO', message: 'Buyurtma muvaffaqiyatli yaratildi' },
    { time: '14:22:03', level: 'ERROR', message: 'To\'lov xatoligi' },
    { time: '14:18:55', level: 'INFO', message: 'Tizim backup yakunlandi' }
  ];

  return (
    <div className="bg-white rounded-2xl p-6 border border-gray-100">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Tizim loglari</h3>
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {logs.map((log, index) => (
          <div key={index} className="flex items-center space-x-4 p-2 bg-gray-50 rounded-lg text-sm">
            <span className="text-gray-500 font-mono">{log.time}</span>
            <span className={`px-2 py-1 rounded text-xs font-medium ${
              log.level === 'ERROR' ? 'bg-red-100 text-red-600' :
              log.level === 'WARN' ? 'bg-yellow-100 text-yellow-600' :
              'bg-blue-100 text-blue-600'
            }`}>
              {log.level}
            </span>
            <span className="text-gray-700">{log.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SystemLogsCard;
