import React, { useState } from 'react';
import { 
  Users, 
  MessageCircle, 
  Heart, 
  Share2, 
  Search, 
  Filter,
  Plus,
  Star,
  Clock,
  ChefHat,
  Award,
  TrendingUp,
  Camera,
  Send
} from 'lucide-react';

const CommunityPage = () => {
  const [activeTab, setActiveTab] = useState('posts');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreatePost, setShowCreatePost] = useState(false);

  const communityPosts = [
    {
      id: 1,
      author: {
        name: 'Aziza Karimova',
        role: 'Baker',
        avatar: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=150',
        verified: true
      },
      content: 'Yangi Red Velvet tortim! 3 soat mehnat natijasi 🍰✨',
      image: 'https://images.pexels.com/photos/1721932/pexels-photo-1721932.jpeg?auto=compress&cs=tinysrgb&w=400',
      likes: 45,
      comments: 12,
      shares: 8,
      time: '2 soat oldin',
      tags: ['RedVelvet', 'Handmade', 'Professional']
    },
    {
      id: 2,
      author: {
        name: 'Bobur Saidov',
        role: 'Shop Owner',
        avatar: 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=150',
        verified: false
      },
      content: 'Do\'konimizda yangi chegirmalar! Barcha cheese cake\'larga 25% chegirma. Shoshiling! 🎉',
      likes: 23,
      comments: 7,
      shares: 15,
      time: '4 soat oldin',
      tags: ['Discount', 'CheeseCake', 'Sale']
    },
    {
      id: 3,
      author: {
        name: 'Malika Ahmedova',
        role: 'Courier',
        avatar: 'https://images.pexels.com/photos/1130626/pexels-photo-1130626.jpeg?auto=compress&cs=tinysrgb&w=150',
        verified: true
      },
      content: 'Bugun 15 ta buyurtma yetkazdim! Eng tez yetkazish rekordim - 12 daqiqa 🚚💨',
      likes: 67,
      comments: 18,
      shares: 5,
      time: '6 soat oldin',
      tags: ['FastDelivery', 'Record', 'Professional']
    }
  ];

  const topMembers = [
    {
      id: 1,
      name: 'Sardor Mirzayev',
      role: 'Master Baker',
      avatar: 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=150',
      points: 2450,
      badge: 'gold'
    },
    {
      id: 2,
      name: 'Nigora Tosheva',
      role: 'Shop Manager',
      avatar: 'https://images.pexels.com/photos/1130626/pexels-photo-1130626.jpeg?auto=compress&cs=tinysrgb&w=150',
      points: 1890,
      badge: 'silver'
    },
    {
      id: 3,
      name: 'Dilshod Rahimov',
      role: 'Top Courier',
      avatar: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=150',
      points: 1650,
      badge: 'bronze'
    }
  ];

  const getBadgeColor = (badge) => {
    switch (badge) {
      case 'gold': return 'text-yellow-600 bg-yellow-100';
      case 'silver': return 'text-gray-600 bg-gray-100';
      case 'bronze': return 'text-orange-600 bg-orange-100';
      default: return 'text-blue-600 bg-blue-100';
    }
  };

  const getRoleColor = (role) => {
    if (role.includes('Baker')) return 'text-orange-600 bg-orange-100';
    if (role.includes('Shop') || role.includes('Manager')) return 'text-green-600 bg-green-100';
    if (role.includes('Courier')) return 'text-purple-600 bg-purple-100';
    return 'text-blue-600 bg-blue-100';
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-6 pb-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Community</h1>
          <p className="text-gray-600 text-sm sm:text-base">Professional hamjamiyat</p>
        </div>
        <button
          onClick={() => setShowCreatePost(true)}
          className="flex items-center space-x-2 bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors"
        >
          <Plus size={16} />
          <span className="hidden sm:inline">Post yaratish</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl border border-gray-100">
        <div className="flex space-x-1 p-1">
          <button
            onClick={() => setActiveTab('posts')}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'posts'
                ? 'bg-orange-500 text-white'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Postlar
          </button>
          <button
            onClick={() => setActiveTab('members')}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'members'
                ? 'bg-orange-500 text-white'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            A'zolar
          </button>
          <button
            onClick={() => setActiveTab('events')}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'events'
                ? 'bg-orange-500 text-white'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Tadbirlar
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <div className="flex items-center bg-white rounded-xl shadow-sm border border-gray-100 px-4 py-3">
          <Search size={18} className="text-gray-400 mr-3" />
          <input
            type="text"
            placeholder="Community-da qidiring..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 outline-none text-gray-700 placeholder-gray-400"
          />
          <button className="ml-3 p-2 text-gray-400 hover:text-orange-500 transition-colors">
            <Filter size={16} />
          </button>
        </div>
      </div>

      {/* Content */}
      {activeTab === 'posts' && (
        <div className="space-y-6">
          {/* Community Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl p-4 border border-gray-100 text-center">
              <Users size={24} className="text-blue-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-900">1,234</p>
              <p className="text-sm text-gray-600">A'zolar</p>
            </div>
            <div className="bg-white rounded-xl p-4 border border-gray-100 text-center">
              <MessageCircle size={24} className="text-green-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-900">567</p>
              <p className="text-sm text-gray-600">Postlar</p>
            </div>
            <div className="bg-white rounded-xl p-4 border border-gray-100 text-center">
              <TrendingUp size={24} className="text-purple-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-900">89%</p>
              <p className="text-sm text-gray-600">Faollik</p>
            </div>
            <div className="bg-white rounded-xl p-4 border border-gray-100 text-center">
              <Award size={24} className="text-yellow-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-900">45</p>
              <p className="text-sm text-gray-600">Mukofotlar</p>
            </div>
          </div>

          {/* Posts */}
          <div className="space-y-6">
            {communityPosts.map((post) => (
              <div key={post.id} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                {/* Post Header */}
                <div className="flex items-center space-x-3 mb-4">
                  <img 
                    src={post.author.avatar}
                    alt={post.author.name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <h3 className="font-semibold text-gray-900">{post.author.name}</h3>
                      {post.author.verified && (
                        <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-xs">✓</span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getRoleColor(post.author.role)}`}>
                        {post.author.role}
                      </span>
                      <span className="text-sm text-gray-500">{post.time}</span>
                    </div>
                  </div>
                </div>

                {/* Post Content */}
                <p className="text-gray-700 mb-4">{post.content}</p>

                {/* Post Image */}
                {post.image && (
                  <img 
                    src={post.image}
                    alt="Post"
                    className="w-full h-64 rounded-xl object-cover mb-4"
                  />
                )}

                {/* Tags */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {post.tags.map((tag) => (
                    <span key={tag} className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
                      #{tag}
                    </span>
                  ))}
                </div>

                {/* Post Actions */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                  <div className="flex items-center space-x-6">
                    <button className="flex items-center space-x-2 text-gray-600 hover:text-red-500 transition-colors">
                      <Heart size={18} />
                      <span className="text-sm">{post.likes}</span>
                    </button>
                    <button className="flex items-center space-x-2 text-gray-600 hover:text-blue-500 transition-colors">
                      <MessageCircle size={18} />
                      <span className="text-sm">{post.comments}</span>
                    </button>
                    <button className="flex items-center space-x-2 text-gray-600 hover:text-green-500 transition-colors">
                      <Share2 size={18} />
                      <span className="text-sm">{post.shares}</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'members' && (
        <div className="space-y-6">
          {/* Top Members */}
          <div className="bg-white rounded-2xl p-6 border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Top A'zolar</h3>
            <div className="space-y-4">
              {topMembers.map((member, index) => (
                <div key={member.id} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-xl">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl font-bold text-gray-400">#{index + 1}</span>
                    <img 
                      src={member.avatar}
                      alt={member.name}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900">{member.name}</h4>
                    <p className="text-sm text-gray-600">{member.role}</p>
                  </div>
                  <div className="text-right">
                    <div className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${getBadgeColor(member.badge)}`}>
                      <Award size={12} />
                      <span>{member.badge}</span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">{member.points} ball</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'events' && (
        <div className="bg-white rounded-2xl p-8 text-center border border-gray-100">
          <Clock size={48} className="text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Tez orada</h3>
          <p className="text-gray-600">Community tadbirlari tez orada qo'shiladi</p>
        </div>
      )}

      {/* Create Post Modal */}
      {showCreatePost && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Yangi post yaratish</h3>
            <textarea
              placeholder="Nima bo'lishyapti?"
              className="w-full h-32 p-4 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
            <div className="flex items-center justify-between mt-4">
              <button className="flex items-center space-x-2 text-gray-600 hover:text-orange-500 transition-colors">
                <Camera size={18} />
                <span>Rasm</span>
              </button>
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowCreatePost(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Bekor qilish
                </button>
                <button className="flex items-center space-x-2 bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors">
                  <Send size={16} />
                  <span>Yuborish</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CommunityPage;