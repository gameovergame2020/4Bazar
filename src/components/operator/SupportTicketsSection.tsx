
import React, { useState } from 'react';
import { Search, MessageCircle, Eye, Phone, Mail } from 'lucide-react';
import { SupportTicket } from '../../services/dataService';

interface SupportTicketsSectionProps {
  supportTickets: SupportTicket[];
  onTicketStatusUpdate: (ticketId: string, status: SupportTicket['status']) => Promise<void>;
}

const SupportTicketsSection: React.FC<SupportTicketsSectionProps> = ({
  supportTickets,
  onTicketStatusUpdate
}) => {
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const getPriorityColor = (priority: SupportTicket['priority']) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-600';
      case 'medium': return 'bg-yellow-100 text-yellow-600';
      case 'low': return 'bg-green-100 text-green-600';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const getTicketStatusColor = (status: SupportTicket['status']) => {
    switch (status) {
      case 'open': return 'bg-red-100 text-red-600';
      case 'in_progress': return 'bg-blue-100 text-blue-600';
      case 'resolved': return 'bg-green-100 text-green-600';
      case 'closed': return 'bg-gray-100 text-gray-600';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const getTicketStatusText = (status: SupportTicket['status']) => {
    switch (status) {
      case 'open': return 'Ochiq';
      case 'in_progress': return 'Jarayonda';
      case 'resolved': return 'Hal qilindi';
      case 'closed': return 'Yopildi';
      default: return status;
    }
  };

  const getPriorityText = (priority: SupportTicket['priority']) => {
    switch (priority) {
      case 'high': return 'Yuqori';
      case 'medium': return 'O\'rta';
      case 'low': return 'Past';
      default: return priority;
    }
  };

  const getCategoryText = (category: SupportTicket['category']) => {
    switch (category) {
      case 'delivery': return 'Yetkazib berish';
      case 'payment': return 'To\'lov';
      case 'quality': return 'Sifat';
      case 'technical': return 'Texnik';
      case 'other': return 'Boshqa';
      default: return category;
    }
  };

  const filteredTickets = supportTickets.filter(ticket => {
    const matchesFilter = selectedFilter === 'all' || ticket.status === selectedFilter;
    const matchesSearch = ticket.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         ticket.customerName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div id="support-tickets-section" className="bg-white rounded-2xl p-6 border border-gray-100">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Qo'llab-quvvatlash so'rovlari</h3>
        <div className="flex items-center space-x-3">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Qidirish..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
            />
          </div>
          <select
            value={selectedFilter}
            onChange={(e) => setSelectedFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
          >
            <option value="all">Barchasi</option>
            <option value="open">Ochiq</option>
            <option value="in_progress">Jarayonda</option>
            <option value="resolved">Hal qilindi</option>
            <option value="closed">Yopildi</option>
          </select>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-4 font-medium text-gray-900">ID</th>
              <th className="text-left py-3 px-4 font-medium text-gray-900">Mijoz</th>
              <th className="text-left py-3 px-4 font-medium text-gray-900">Mavzu</th>
              <th className="text-left py-3 px-4 font-medium text-gray-900">Kategoriya</th>
              <th className="text-left py-3 px-4 font-medium text-gray-900">Muhimlik</th>
              <th className="text-left py-3 px-4 font-medium text-gray-900">Holat</th>
              <th className="text-left py-3 px-4 font-medium text-gray-900">Yaratildi</th>
              <th className="text-left py-3 px-4 font-medium text-gray-900">Amallar</th>
            </tr>
          </thead>
          <tbody>
            {filteredTickets.map((ticket) => (
              <tr key={ticket.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-3 px-4 font-medium text-gray-900">#{ticket.id?.slice(-6)}</td>
                <td className="py-3 px-4">
                  <div>
                    <p className="font-medium text-gray-900">{ticket.customerName}</p>
                    <p className="text-sm text-gray-600">{ticket.customerPhone}</p>
                  </div>
                </td>
                <td className="py-3 px-4 text-gray-700 max-w-xs truncate" title={ticket.subject}>
                  {ticket.subject}
                </td>
                <td className="py-3 px-4 text-gray-600 text-sm">
                  {getCategoryText(ticket.category)}
                </td>
                <td className="py-3 px-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(ticket.priority)}`}>
                    {getPriorityText(ticket.priority)}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTicketStatusColor(ticket.status)}`}>
                    {getTicketStatusText(ticket.status)}
                  </span>
                </td>
                <td className="py-3 px-4 text-gray-600 text-sm">
                  {ticket.createdAt.toLocaleDateString('uz-UZ')}
                  <br />
                  <span className="text-xs text-gray-500">
                    {ticket.createdAt.toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <div className="flex space-x-2 flex-wrap">
                    <button 
                      className="p-1 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors"
                      title="Tafsilotlar"
                    >
                      <Eye size={16} />
                    </button>
                    {ticket.customerPhone && (
                      <button 
                        onClick={() => window.open(`tel:${ticket.customerPhone}`, '_self')}
                        className="p-1 text-green-600 hover:text-green-700 hover:bg-green-50 rounded transition-colors"
                        title="Qo'ng'iroq qilish"
                      >
                        <Phone size={16} />
                      </button>
                    )}
                    {ticket.customerEmail && (
                      <button 
                        onClick={() => window.open(`mailto:${ticket.customerEmail}`, '_self')}
                        className="p-1 text-purple-600 hover:text-purple-700 hover:bg-purple-50 rounded transition-colors"
                        title="Email yuborish"
                      >
                        <Mail size={16} />
                      </button>
                    )}
                    {ticket.status === 'open' && (
                      <button
                        onClick={() => onTicketStatusUpdate(ticket.id!, 'in_progress')}
                        className="px-2 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600 transition-colors"
                      >
                        Olish
                      </button>
                    )}
                    {ticket.status === 'in_progress' && (
                      <button
                        onClick={() => onTicketStatusUpdate(ticket.id!, 'resolved')}
                        className="px-2 py-1 bg-green-500 text-white rounded text-xs hover:bg-green-600 transition-colors"
                      >
                        Hal qilish
                      </button>
                    )}
                    {ticket.status === 'resolved' && (
                      <button
                        onClick={() => onTicketStatusUpdate(ticket.id!, 'closed')}
                        className="px-2 py-1 bg-gray-500 text-white rounded text-xs hover:bg-gray-600 transition-colors"
                      >
                        Yopish
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredTickets.length === 0 && (
          <div className="text-center py-8">
            <MessageCircle size={48} className="text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">
              {searchQuery || selectedFilter !== 'all' 
                ? 'Hech qanday so\'rov topilmadi' 
                : 'Hozircha qo\'llab-quvvatlash so\'rovlari yo\'q'
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SupportTicketsSection;
