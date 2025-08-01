import React, { useState } from 'react';
import { 
  ArrowLeft,
  Search,
  MessageCircle,
  Phone,
  Mail,
  ChevronRight,
  ChevronDown,
  HelpCircle,
  Clock,
  CheckCircle,
  AlertCircle,
  Send,
  Paperclip,
  Star
} from 'lucide-react';

interface User {
  id: number;
  name: string;
  email: string;
  phone: string;
  avatar: string;
  joinDate: string;
  totalOrders: number;
  favoriteCount: number;
}

interface HelpPageProps {
  user: User;
  onBack: () => void;
}

const HelpPage: React.FC<HelpPageProps> = ({ user, onBack }) => {
  const [activeTab, setActiveTab] = useState<'faq' | 'contact' | 'tickets'>('faq');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [showContactForm, setShowContactForm] = useState(false);
  const [contactForm, setContactForm] = useState({
    subject: '',
    message: '',
    category: 'general',
    priority: 'medium',
  });

  const faqCategories = [
    {
      id: 'orders',
      title: 'Buyurtmalar',
      questions: [
        {
          id: 1,
          question: 'Buyurtmani qanday bekor qilish mumkin?',
          answer: 'Buyurtmani tayyorlash boshlanishidan oldin bekor qilish mumkin. Profil bo\'limidagi "Buyurtmalarim" sahifasiga o\'ting va tegishli buyurtmani toping. "Bekor qilish" tugmasini bosing. Agar buyurtma allaqachon tayyorlanayotgan bo\'lsa, qo\'llab-quvvatlash xizmati bilan bog\'laning.',
        },
        {
          id: 2,
          question: 'Buyurtma qachon yetkazib beriladi?',
          answer: 'Yetkazib berish vaqti restoran va sizning joylashuvingizga bog\'liq. Odatda 25-60 daqiqa orasida. Aniq vaqtni buyurtma berish paytida ko\'rishingiz mumkin. Buyurtma holati haqida real vaqtda xabar beramiz.',
        },
        {
          id: 3,
          question: 'Buyurtma holatini qanday kuzatish mumkin?',
          answer: 'Buyurtma berganingizdan so\'ng, profil bo\'limidagi "Buyurtmalarim" sahifasida buyurtma holatini kuzatishingiz mumkin. Shuningdek, push-bildirishnomalar orqali har bir bosqich haqida xabar beramiz.',
        },
      ],
    },
    {
      id: 'payment',
      title: 'To\'lov',
      questions: [
        {
          id: 4,
          question: 'Qanday to\'lov usullari mavjud?',
          answer: 'Biz Visa, Mastercard kartalar va naqd to\'lovni qabul qilamiz. Kartangizni xavfsiz saqlash uchun profil sozlamalarida qo\'shishingiz mumkin.',
        },
        {
          id: 5,
          question: 'To\'lov xavfsizligi qanday ta\'minlanadi?',
          answer: 'Barcha to\'lovlar SSL shifrlash orqali himoyalanadi. Karta ma\'lumotlari PCI DSS standartlariga muvofiq saqlanadi. Biz sizning moliyaviy ma\'lumotlaringizni hech qachon uchinchi shaxslarga bermaydi.',
        },
        {
          id: 6,
          question: 'Pulni qaytarish qanday amalga oshiriladi?',
          answer: 'Agar buyurtmangiz bekor qilingan bo\'lsa yoki muammo yuz bergan bo\'lsa, pul 3-5 ish kuni ichida kartangizga qaytariladi. Naqd to\'lov bo\'lgan holda, kuryer orqali qaytarib beramiz.',
        },
      ],
    },
    {
      id: 'delivery',
      title: 'Yetkazib berish',
      questions: [
        {
          id: 7,
          question: 'Yetkazib berish hududi qayerlar?',
          answer: 'Hozircha Toshkent shahrining barcha tumanlarida xizmat ko\'rsatamiz. Yangi hududlarni qo\'shish ustida ishlamoqdamiz.',
        },
        {
          id: 8,
          question: 'Yetkazib berish narxi qancha?',
          answer: 'Yetkazib berish narxi masofa va buyurtma miqdoriga bog\'liq. Odatda 10,000-25,000 so\'m orasida. 200,000 so\'mdan yuqori buyurtmalarda yetkazib berish bepul.',
        },
        {
          id: 9,
          question: 'Kuryer bilan bog\'lanish mumkinmi?',
          answer: 'Ha, buyurtma yo\'lda bo\'lganda kuryer raqami bilan SMS yuboramiz. Shuningdek, ilovada kuryer joylashuvini real vaqtda kuzatishingiz mumkin.',
        },
      ],
    },
    {
      id: 'account',
      title: 'Hisob',
      questions: [
        {
          id: 10,
          question: 'Parolni qanday o\'zgartirish mumkin?',
          answer: 'Profil > Sozlamalar > Parolni o\'zgartirish bo\'limiga o\'ting. Joriy parolingizni kiriting va yangi parolni belgilang.',
        },
        {
          id: 11,
          question: 'Hisobni o\'chirish mumkinmi?',
          answer: 'Ha, agar hisobingizni o\'chirmoqchi bo\'lsangiz, qo\'llab-quvvatlash xizmati bilan bog\'laning. Barcha ma\'lumotlaringiz xavfsiz o\'chiriladi.',
        },
      ],
    },
  ];

  const supportTickets = [
    {
      id: 1,
      subject: 'Buyurtma yetib kelmadi',
      category: 'Yetkazib berish',
      status: 'open',
      priority: 'high',
      createdAt: '2024-01-20 14:30',
      lastReply: '2024-01-20 15:45',
      messages: 3,
    },
    {
      id: 2,
      subject: 'Karta to\'lovi muammosi',
      category: 'To\'lov',
      status: 'resolved',
      priority: 'medium',
      createdAt: '2024-01-18 10:15',
      lastReply: '2024-01-18 16:20',
      messages: 5,
    },
    {
      id: 3,
      subject: 'Tort sifati haqida shikoyat',
      category: 'Sifat',
      status: 'pending',
      priority: 'low',
      createdAt: '2024-01-15 09:00',
      lastReply: '2024-01-16 11:30',
      messages: 2,
    },
  ];

  const filteredFaqs = faqCategories.map(category => ({
    ...category,
    questions: category.questions.filter(q => 
      q.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.answer.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(category => category.questions.length > 0);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'text-blue-600 bg-blue-50';
      case 'pending':
        return 'text-yellow-600 bg-yellow-50';
      case 'resolved':
        return 'text-green-600 bg-green-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'open':
        return 'Ochiq';
      case 'pending':
        return 'Kutilmoqda';
      case 'resolved':
        return 'Hal qilindi';
      default:
        return 'Noma\'lum';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'text-red-600';
      case 'medium':
        return 'text-yellow-600';
      case 'low':
        return 'text-green-600';
      default:
        return 'text-gray-600';
    }
  };

  const handleSubmitContact = () => {
    if (!contactForm.subject || !contactForm.message) return;
    
    // Simulate ticket creation
    console.log('Creating support ticket:', contactForm);
    setContactForm({ subject: '', message: '', category: 'general', priority: 'medium' });
    setShowContactForm(false);
    setActiveTab('tickets');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-10">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between max-w-6xl mx-auto">
            <div className="flex items-center space-x-3">
              <button 
                onClick={onBack}
                className="p-2 text-gray-600 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
              >
                <ArrowLeft size={20} />
              </button>
              <h1 className="text-xl font-bold text-gray-900">Yordam markazi</h1>
            </div>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex space-x-8">
            <button
              onClick={() => setActiveTab('faq')}
              className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'faq'
                  ? 'border-orange-500 text-orange-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <div className="flex items-center space-x-2">
                <HelpCircle size={16} />
                <span>Tez-tez so'raladigan savollar</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('contact')}
              className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'contact'
                  ? 'border-orange-500 text-orange-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <div className="flex items-center space-x-2">
                <MessageCircle size={16} />
                <span>Bog'lanish</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('tickets')}
              className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'tickets'
                  ? 'border-orange-500 text-orange-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Clock size={16} />
                <span>Murojaatlarim</span>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-6xl mx-auto px-4 py-6">
        {activeTab === 'faq' && (
          <div className="space-y-6">
            {/* Search */}
            <div className="relative">
              <div className="flex items-center bg-white rounded-xl shadow-sm border border-gray-100 px-4 py-3">
                <Search size={18} className="text-gray-400 mr-3" />
                <input
                  type="text"
                  placeholder="Savollarni qidiring..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 outline-none text-gray-700 placeholder-gray-400"
                />
              </div>
            </div>

            {/* FAQ Categories */}
            <div className="space-y-6">
              {filteredFaqs.map((category) => (
                <div key={category.id} className="bg-white rounded-2xl shadow-sm border border-gray-100">
                  <div className="p-6 border-b border-gray-100">
                    <h2 className="text-lg font-semibold text-gray-900">{category.title}</h2>
                  </div>
                  <div className="divide-y divide-gray-100">
                    {category.questions.map((faq) => (
                      <div key={faq.id} className="p-6">
                        <button
                          onClick={() => setExpandedFaq(expandedFaq === faq.id ? null : faq.id)}
                          className="w-full flex items-center justify-between text-left"
                        >
                          <h3 className="font-medium text-gray-900 pr-4">{faq.question}</h3>
                          <ChevronDown 
                            size={18} 
                            className={`text-gray-400 transition-transform ${
                              expandedFaq === faq.id ? 'rotate-180' : ''
                            }`}
                          />
                        </button>
                        {expandedFaq === faq.id && (
                          <div className="mt-4 text-gray-600 leading-relaxed">
                            {faq.answer}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {searchQuery && filteredFaqs.length === 0 && (
              <div className="bg-white rounded-2xl p-8 text-center border border-gray-100">
                <Search size={40} className="text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Hech narsa topilmadi</h3>
                <p className="text-gray-600 mb-4">
                  Qidiruv so'rovingizga mos javob topilmadi. Boshqa kalit so'zlar bilan urinib ko'ring.
                </p>
                <button
                  onClick={() => setActiveTab('contact')}
                  className="bg-orange-500 text-white px-6 py-2 rounded-lg hover:bg-orange-600 transition-colors"
                >
                  Savol berish
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'contact' && (
          <div className="space-y-6">
            {/* Contact Options */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Phone size={24} className="text-blue-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Telefon</h3>
                <p className="text-gray-600 mb-4">Dushanba-Yakshanba: 9:00-22:00</p>
                <a 
                  href="tel:+998712345678"
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  +998 71 234 56 78
                </a>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 text-center">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <MessageCircle size={24} className="text-green-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Chat</h3>
                <p className="text-gray-600 mb-4">Tezkor javob olish uchun</p>
                <button className="text-green-600 hover:text-green-700 font-medium">
                  Chatni boshlash
                </button>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 text-center">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Mail size={24} className="text-purple-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Email</h3>
                <p className="text-gray-600 mb-4">24 soat ichida javob beramiz</p>
                <a 
                  href="mailto:support@tortbazar.uz"
                  className="text-purple-600 hover:text-purple-700 font-medium"
                >
                  support@tortbazar.uz
                </a>
              </div>
            </div>

            {/* Contact Form */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-900">Murojaat yuborish</h2>
                {!showContactForm && (
                  <button
                    onClick={() => setShowContactForm(true)}
                    className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors"
                  >
                    Yangi murojaat
                  </button>
                )}
              </div>

              {showContactForm && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Kategoriya</label>
                      <select
                        value={contactForm.category}
                        onChange={(e) => setContactForm(prev => ({ ...prev, category: e.target.value }))}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      >
                        <option value="general">Umumiy savol</option>
                        <option value="order">Buyurtma</option>
                        <option value="payment">To'lov</option>
                        <option value="delivery">Yetkazib berish</option>
                        <option value="quality">Sifat</option>
                        <option value="technical">Texnik muammo</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Muhimlik darajasi</label>
                      <select
                        value={contactForm.priority}
                        onChange={(e) => setContactForm(prev => ({ ...prev, priority: e.target.value }))}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      >
                        <option value="low">Past</option>
                        <option value="medium">O'rta</option>
                        <option value="high">Yuqori</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Mavzu</label>
                    <input
                      type="text"
                      value={contactForm.subject}
                      onChange={(e) => setContactForm(prev => ({ ...prev, subject: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      placeholder="Muammo yoki savolingizni qisqacha yozing"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Xabar</label>
                    <textarea
                      value={contactForm.message}
                      onChange={(e) => setContactForm(prev => ({ ...prev, message: e.target.value }))}
                      rows={5}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      placeholder="Muammoni batafsil tasvirlab bering..."
                    />
                  </div>

                  <div className="flex items-center space-x-3">
                    <button
                      onClick={handleSubmitContact}
                      className="flex items-center space-x-2 bg-orange-500 text-white px-6 py-3 rounded-lg hover:bg-orange-600 transition-colors"
                    >
                      <Send size={16} />
                      <span>Yuborish</span>
                    </button>
                    <button
                      onClick={() => {
                        setShowContactForm(false);
                        setContactForm({ subject: '', message: '', category: 'general', priority: 'medium' });
                      }}
                      className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                    >
                      Bekor qilish
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'tickets' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Murojaatlarim</h2>
              <button
                onClick={() => {
                  setActiveTab('contact');
                  setShowContactForm(true);
                }}
                className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors"
              >
                Yangi murojaat
              </button>
            </div>

            <div className="space-y-4">
              {supportTickets.map((ticket) => (
                <div key={ticket.id} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="font-semibold text-gray-900">#{ticket.id} - {ticket.subject}</h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(ticket.status)}`}>
                          {getStatusText(ticket.status)}
                        </span>
                        <span className={`text-xs font-medium ${getPriorityColor(ticket.priority)}`}>
                          {ticket.priority === 'high' ? 'Yuqori' : ticket.priority === 'medium' ? 'O\'rta' : 'Past'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">Kategoriya: {ticket.category}</p>
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span>Yaratildi: {ticket.createdAt}</span>
                        <span>Oxirgi javob: {ticket.lastReply}</span>
                        <span>{ticket.messages} ta xabar</span>
                      </div>
                    </div>
                    <button className="p-2 text-gray-400 hover:text-orange-500 transition-colors">
                      <ChevronRight size={16} />
                    </button>
                  </div>
                  
                  {ticket.status === 'resolved' && (
                    <div className="mt-4 p-3 bg-green-50 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <CheckCircle size={16} className="text-green-600" />
                          <span className="text-sm text-green-800">Muammo hal qilindi</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <span className="text-sm text-green-700">Baholang:</span>
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button key={star} className="text-yellow-400 hover:text-yellow-500">
                              <Star size={14} />
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {supportTickets.length === 0 && (
              <div className="bg-white rounded-2xl p-8 text-center border border-gray-100">
                <MessageCircle size={40} className="text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Murojaatlar yo'q</h3>
                <p className="text-gray-600 mb-4">
                  Hozircha hech qanday murojaat yubormadingiz. Savolingiz bo'lsa, biz bilan bog'laning.
                </p>
                <button
                  onClick={() => {
                    setActiveTab('contact');
                    setShowContactForm(true);
                  }}
                  className="bg-orange-500 text-white px-6 py-2 rounded-lg hover:bg-orange-600 transition-colors"
                >
                  Birinchi murojaatingizni yuboring
                </button>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default HelpPage;