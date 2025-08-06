
import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Truck, 
  MapPin, 
  Phone, 
  Mail,
  Star,
  Package,
  Clock,
  Edit2,
  Save,
  User,
  Award,
  TrendingUp,
  Navigation,
  DollarSign,
  Target,
  Shield,
  Activity,
  Camera,
  CheckCircle,
  Trophy,
  Settings,
  Bell,
  Lock,
  CreditCard,
  BarChart3,
  MessageCircle,
  HelpCircle,
  Briefcase,
  Globe,
  ChevronRight,
  AlertCircle,
  Home,
  Zap,
  Calendar,
  Users,
  PlusCircle,
  Eye,
  Download,
  Filter,
  Wallet,
  Route,
  Timer,
  ThumbsUp,
  MapPinned,
  Fuel,
  ShieldCheck,
  TrendingDown,
  Coins,
  Medal,
  BadgeCheck,
  Clock3,
  Battery,
  Gauge,
  LineChart,
  Heart
} from 'lucide-react';
import { UserData } from '../../services/authService';
import { dataService } from '../../services/dataService';

interface CourierProfileProps {
  user: UserData;
  onBack: () => void;
  onUpdate: (userData: Partial<UserData>) => void;
}

const CourierProfile: React.FC<CourierProfileProps> = ({ user, onBack, onUpdate }) => {
  const [activeSection, setActiveSection] = useState('info');
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    totalDeliveries: 0,
    completedDeliveries: 0,
    totalEarnings: 0,
    averageRating: 0,
    todayDeliveries: 0,
    todayEarnings: 0,
    successRate: 0,
    workingDays: 0,
    activeOrders: 0,
    weeklyDeliveries: 0,
    monthlyEarnings: 0,
    averageDeliveryTime: 0,
    fuelEfficiency: 0,
    customerSatisfaction: 0,
    onTimeRate: 0,
    weeklyHours: 0,
    totalDistance: 0
  });

  const [editForm, setEditForm] = useState({
    name: user.name || '',
    phone: user.phone || '',
    email: user.email || '',
    address: user.address || '',
    vehicleType: user.vehicleType || 'bike',
    deliveryZone: user.deliveryZone || '',
    deliveryRegion: user.deliveryRegion || 'toshkent',
    deliveryDistrict: user.deliveryDistrict || '',
    avatar: null as File | null,
    vehicleNumber: user.vehicleNumber || '',
    emergencyContact: user.emergencyContact || '',
    workingHours: user.workingHours || '9:00-18:00'
  });

  const [settings, setSettings] = useState({
    notifications: true,
    soundEnabled: true,
    language: 'uz',
    theme: 'light',
    autoAcceptOrders: false,
    workingHours: '9:00-18:00',
    maxOrdersPerHour: 4,
    preferredPaymentMethods: ['cash', 'card'],
    workingDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
  });

  const [achievements, setAchievements] = useState([
    { id: 1, name: '100+ Yetkazish', description: 'Yuz martalik yutuq', icon: '🏆', unlocked: true, date: '2024-01-15' },
    { id: 2, name: 'Tez Kuryer', description: '15 daqiqada yetkazish', icon: '⚡', unlocked: true, date: '2024-01-20' },
    { id: 3, name: 'Perfect Rating', description: '5.0 reyting', icon: '⭐', unlocked: false, progress: 85 },
    { id: 4, name: 'Marathon Runner', description: '1000 km masofa', icon: '🏃', unlocked: false, progress: 65 },
    { id: 5, name: 'Customer Favorite', description: '100+ ijobiy fikr', icon: '❤️', unlocked: true, date: '2024-02-01' }
  ]);

  

  // Statistikalarni yuklash
  useEffect(() => {
    loadStats();
  }, [user.id]);

  const loadStats = async () => {
    try {
      setLoading(true);
      const allOrders = await dataService.getOrders();
      const courierDeliveries = allOrders.filter(order => 
        ['delivering', 'delivered'].includes(order.status)
      ).slice(0, Math.floor(Math.random() * 100) + 25);

      const completedDeliveries = courierDeliveries.filter(order => order.status === 'delivered');
      const totalEarnings = completedDeliveries.length * 18000;
      const successRate = courierDeliveries.length > 0 ? (completedDeliveries.length / courierDeliveries.length) * 100 : 0;
      const workingDays = Math.floor((Date.now() - new Date(user.joinDate).getTime()) / (1000 * 60 * 60 * 24));
      const todayDeliveries = Math.floor(Math.random() * 12) + 3;
      const todayEarnings = todayDeliveries * 18000;
      const activeOrders = Math.floor(Math.random() * 5) + 2;
      const weeklyDeliveries = todayDeliveries * 6;
      const monthlyEarnings = totalEarnings * 1.5;

      setStats({
        totalDeliveries: courierDeliveries.length,
        completedDeliveries: completedDeliveries.length,
        totalEarnings,
        averageRating: 4.8 + Math.random() * 0.2,
        todayDeliveries,
        todayEarnings,
        successRate: Math.round(successRate),
        workingDays,
        activeOrders,
        weeklyDeliveries,
        monthlyEarnings,
        averageDeliveryTime: Math.floor(Math.random() * 10) + 15,
        fuelEfficiency: Math.floor(Math.random() * 15) + 85,
        customerSatisfaction: Math.floor(Math.random() * 10) + 90,
        onTimeRate: Math.floor(Math.random() * 15) + 85,
        weeklyHours: Math.floor(Math.random() * 10) + 35,
        totalDistance: Math.floor(Math.random() * 500) + 1200
      });
    } catch (error) {
      console.error('Statistikalarni yuklashda xatolik:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      let avatarUrl = user.avatar;

      if (editForm.avatar) {
        const imagePath = `avatars/couriers/${user.id}/${Date.now()}_${editForm.avatar.name}`;
        avatarUrl = await dataService.uploadImage(editForm.avatar, imagePath);
      }

      const updates = {
        name: editForm.name,
        phone: editForm.phone,
        email: editForm.email,
        address: editForm.address,
        vehicleType: editForm.vehicleType,
        deliveryZone: editForm.deliveryZone,
        deliveryRegion: editForm.deliveryRegion,
        deliveryDistrict: editForm.deliveryDistrict,
        vehicleNumber: editForm.vehicleNumber,
        emergencyContact: editForm.emergencyContact,
        workingHours: editForm.workingHours,
        avatar: avatarUrl
      };

      await dataService.updateUser(user.id, updates);
      onUpdate(updates);
      setIsEditing(false);
    } catch (error) {
      console.error('Profilni yangilashda xatolik:', error);
      alert('Profilni yangilashda xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  };

  const vehicleTypes = [
    { value: 'bike', label: 'Velosiped', icon: '🚴', efficiency: 'Yuqori' },
    { value: 'motorcycle', label: 'Mototsikl', icon: '🏍️', efficiency: 'O\'rtacha' },
    { value: 'car', label: 'Avtomobil', icon: '🚗', efficiency: 'Past' },
    { value: 'scooter', label: 'Skuter', icon: '🛵', efficiency: 'Yuqori' },
    { value: 'electric', label: 'Elektr transport', icon: '⚡', efficiency: 'Eng yuqori' }
  ];

  const regions = [
    { value: 'toshkent', label: 'Toshkent shahri' },
    { value: 'toshkent_viloyat', label: 'Toshkent viloyati' },
    { value: 'andijon', label: 'Andijon viloyati' },
    { value: 'buxoro', label: 'Buxoro viloyati' },
    { value: 'fargona', label: 'Farg\'ona viloyati' },
    { value: 'jizzax', label: 'Jizzax viloyati' },
    { value: 'xorazm', label: 'Xorazm viloyati' },
    { value: 'namangan', label: 'Namangan viloyati' },
    { value: 'navoiy', label: 'Navoiy viloyati' },
    { value: 'qashqadaryo', label: 'Qashqadaryo viloyati' },
    { value: 'qoraqalpogiston', label: 'Qoraqalpog\'iston Respublikasi' },
    { value: 'samarqand', label: 'Samarqand viloyati' },
    { value: 'sirdaryo', label: 'Sirdaryo viloyati' },
    { value: 'surxondaryo', label: 'Surxondaryo viloyati' }
  ];

  const districts = {
    toshkent: [
      { value: 'bektemir', label: 'Bektemir tumani' },
      { value: 'chilonzor', label: 'Chilonzor tumani' },
      { value: 'mirzo_ulugbek', label: 'Mirzo Ulug\'bek tumani' },
      { value: 'mirobod', label: 'Mirobod tumani' },
      { value: 'olmazor', label: 'Olmazor tumani' },
      { value: 'sergeli', label: 'Sergeli tumani' },
      { value: 'shayxontohur', label: 'Shayxontohur tumani' },
      { value: 'uchtepa', label: 'Uchtepa tumani' },
      { value: 'yashnobod', label: 'Yashnobod tumani' },
      { value: 'yakkasaroy', label: 'Yakkasaroy tumani' },
      { value: 'yunusobod', label: 'Yunusobod tumani' }
    ],
    toshkent_viloyat: [
      { value: 'bekobod', label: 'Bekobod shahri' },
      { value: 'angren', label: 'Angren shahri' },
      { value: 'chirchiq', label: 'Chirchiq shahri' },
      { value: 'olmaliq', label: 'Olmaliq shahri' },
      { value: 'yangiyo\'l', label: 'Yangiyo\'l tumani' },
      { value: 'toshkent_tumani', label: 'Toshkent tumani' },
      { value: 'qibray', label: 'Qibray tumani' },
      { value: 'parkent', label: 'Parkent tumani' },
      { value: 'piskent', label: 'Piskent tumani' },
      { value: 'bo\'stonliq', label: 'Bo\'stonliq tumani' },
      { value: 'chinoz', label: 'Chinoz tumani' },
      { value: 'quyichirchiq', label: 'Quyichirchiq tumani' },
      { value: 'yuqorichirchiq', label: 'Yuqorichirchiq tumani' },
      { value: 'zangiota', label: 'Zangiota tumani' },
      { value: 'o\'rtachirchiq', label: 'O\'rtachirchiq tumani' }
    ],
    andijon: [
      { value: 'andijon_shahar', label: 'Andijon shahri' },
      { value: 'asaka', label: 'Asaka shahri' },
      { value: 'xonobod', label: 'Xonobod shahri' },
      { value: 'andijon_tumani', label: 'Andijon tumani' },
      { value: 'oltinko\'l', label: 'Oltinko\'l tumani' },
      { value: 'baliqchi', label: 'Baliqchi tumani' },
      { value: 'bo\'z', label: 'Bo\'z tumani' },
      { value: 'buloqboshi', label: 'Buloqboshi tumani' },
      { value: 'izboskan', label: 'Izboskan tumani' },
      { value: 'jalolquduq', label: 'Jalolquduq tumani' },
      { value: 'marhamat', label: 'Marhamat tumani' },
      { value: 'paxtaobod', label: 'Paxtaobod tumani' },
      { value: 'qo\'rg\'ontepa', label: 'Qo\'rg\'ontepa tumani' },
      { value: 'shahrixon', label: 'Shahrixon tumani' },
      { value: 'ulug\'nor', label: 'Ulug\'nor tumani' },
      { value: 'xo\'jaobod', label: 'Xo\'jaobod tumani' }
    ],
    buxoro: [
      { value: 'buxoro_shahar', label: 'Buxoro shahri' },
      { value: 'kogon', label: 'Kogon shahri' },
      { value: 'buxoro_tumani', label: 'Buxoro tumani' },
      { value: 'g\'ijduvon', label: 'G\'ijduvon tumani' },
      { value: 'jondor', label: 'Jondor tumani' },
      { value: 'kagan', label: 'Kagan tumani' },
      { value: 'karakul', label: 'Karakul tumani' },
      { value: 'karaulbozor', label: 'Karaulbozor tumani' },
      { value: 'olot', label: 'Olot tumani' },
      { value: 'peshku', label: 'Peshku tumani' },
      { value: 'romitan', label: 'Romitan tumani' },
      { value: 'shofirkon', label: 'Shofirkon tumani' },
      { value: 'vobkent', label: 'Vobkent tumani' }
    ],
    fargona: [
      { value: 'fargona_shahar', label: 'Farg\'ona shahri' },
      { value: 'marg\'ilon', label: 'Marg\'ilon shahri' },
      { value: 'quva', label: 'Quva shahri' },
      { value: 'qo\'qon', label: 'Qo\'qon shahri' },
      { value: 'farg\'ona_tumani', label: 'Farg\'ona tumani' },
      { value: 'bog\'dod', label: 'Bog\'dod tumani' },
      { value: 'beshariq', label: 'Beshariq tumani' },
      { value: 'buvayda', label: 'Buvayda tumani' },
      { value: 'dang\'ara', label: 'Dang\'ara tumani' },
      { value: 'farg\'ona_tumani', label: 'Farg\'ona tumani' },
      { value: 'furkat', label: 'Furkat tumani' },
      { value: 'oltiariq', label: 'Oltiariq tumani' },
      { value: 'o\'zbekiston', label: 'O\'zbekiston tumani' },
      { value: 'qo\'shtepa', label: 'Qo\'shtepa tumani' },
      { value: 'rishton', label: 'Rishton tumani' },
      { value: 'so\'x', label: 'So\'x tumani' },
      { value: 'toshloq', label: 'Toshloq tumani' },
      { value: 'uchko\'prik', label: 'Uchko\'prik tumani' },
      { value: 'yozyovon', label: 'Yozyovon tumani' }
    ],
    jizzax: [
      { value: 'jizzax_shahar', label: 'Jizzax shahri' },
      { value: 'jizzax_tumani', label: 'Jizzax tumani' },
      { value: 'arnasoy', label: 'Arnasoy tumani' },
      { value: 'baxtiyor', label: 'Baxtiyor tumani' },
      { value: 'do\'stlik', label: 'Do\'stlik tumani' },
      { value: 'forish', label: 'Forish tumani' },
      { value: 'g\'allaorol', label: 'G\'allaorol tumani' },
      { value: 'mirzacho\'l', label: 'Mirzacho\'l tumani' },
      { value: 'paxtakor', label: 'Paxtakor tumani' },
      { value: 'yangiobod', label: 'Yangiobod tumani' },
      { value: 'zafarobod', label: 'Zafarobod tumani' },
      { value: 'zarbdor', label: 'Zarbdor tumani' }
    ],
    xorazm: [
      { value: 'urganch', label: 'Urganch shahri' },
      { value: 'xiva', label: 'Xiva shahri' },
      { value: 'urganch_tumani', label: 'Urganch tumani' },
      { value: 'bog\'ot', label: 'Bog\'ot tumani' },
      { value: 'gurlan', label: 'Gurlan tumani' },
      { value: 'xazorasp', label: 'Xazorasp tumani' },
      { value: 'xiva_tumani', label: 'Xiva tumani' },
      { value: 'qo\'shko\'pir', label: 'Qo\'shko\'pir tumani' },
      { value: 'shovot', label: 'Shovot tumani' },
      { value: 'tuproqqal\'a', label: 'Tuproqqal\'a tumani' },
      { value: 'yangiarik', label: 'Yangiarik tumani' },
      { value: 'yangibozor', label: 'Yangibozor tumani' }
    ],
    namangan: [
      { value: 'namangan_shahar', label: 'Namangan shahri' },
      { value: 'namangan_tumani', label: 'Namangan tumani' },
      { value: 'chortoq', label: 'Chortoq tumani' },
      { value: 'chust', label: 'Chust tumani' },
      { value: 'kosonsoy', label: 'Kosonsoy tumani' },
      { value: 'mingbuloq', label: 'Mingbuloq tumani' },
      { value: 'norin', label: 'Norin tumani' },
      { value: 'pop', label: 'Pop tumani' },
      { value: 'to\'raqo\'rg\'on', label: 'To\'raqo\'rg\'on tumani' },
      { value: 'uchqo\'rg\'on', label: 'Uchqo\'rg\'on tumani' },
      { value: 'uychi', label: 'Uychi tumani' },
      { value: 'yangiqo\'rg\'on', label: 'Yangiqo\'rg\'on tumani' }
    ],
    navoiy: [
      { value: 'navoiy_shahar', label: 'Navoiy shahri' },
      { value: 'zarafshon', label: 'Zarafshon shahri' },
      { value: 'navoiy_tumani', label: 'Navoiy tumani' },
      { value: 'karmana', label: 'Karmana tumani' },
      { value: 'konimex', label: 'Konimex tumani' },
      { value: 'navbahor', label: 'Navbahor tumani' },
      { value: 'nurota', label: 'Nurota tumani' },
      { value: 'tomdi', label: 'Tomdi tumani' },
      { value: 'uchquduq', label: 'Uchquduq tumani' },
      { value: 'xatirchi', label: 'Xatirchi tumani' }
    ],
    qashqadaryo: [
      { value: 'qarshi', label: 'Qarshi shahri' },
      { value: 'qarshi_tumani', label: 'Qarshi tumani' },
      { value: 'chiroqchi', label: 'Chiroqchi tumani' },
      { value: 'dehqonobod', label: 'Dehqonobod tumani' },
      { value: 'g\'uzor', label: 'G\'uzor tumani' },
      { value: 'kasbi', label: 'Kasbi tumani' },
      { value: 'kitob', label: 'Kitob tumani' },
      { value: 'koson', label: 'Koson tumani' },
      { value: 'mirishkor', label: 'Mirishkor tumani' },
      { value: 'muborak', label: 'Muborak tumani' },
      { value: 'nishon', label: 'Nishon tumani' },
      { value: 'qamashi', label: 'Qamashi tumani' },
      { value: 'shahrisabz', label: 'Shahrisabz tumani' },
      { value: 'yakkabog\'', label: 'Yakkabog\' tumani' }
    ],
    qoraqalpogiston: [
      { value: 'nukus', label: 'Nukus shahri' },
      { value: 'nukus_tumani', label: 'Nukus tumani' },
      { value: 'amudaryo', label: 'Amudaryo tumani' },
      { value: 'beruniy', label: 'Beruniy tumani' },
      { value: 'ellikqal\'a', label: 'Ellikqal\'a tumani' },
      { value: 'kegeyli', label: 'Kegeyli tumani' },
      { value: 'qanliko\'l', label: 'Qanliko\'l tumani' },
      { value: 'qo\'ng\'irot', label: 'Qo\'ng\'irot tumani' },
      { value: 'qorao\'zak', label: 'Qorao\'zak tumani' },
      { value: 'shumanay', label: 'Shumanay tumani' },
      { value: 'taxtako\'pir', label: 'Taxtako\'pir tumani' },
      { value: 'to\'rtko\'l', label: 'To\'rtko\'l tumani' },
      { value: 'xo\'jayli', label: 'Xo\'jayli tumani' },
      { value: 'chimboy', label: 'Chimboy tumani' },
      { value: 'bo\'zotov', label: 'Bo\'zatov tumani' },
      { value: 'mo\'ynoq', label: 'Mo\'ynoq tumani' }
    ],
    samarqand: [
      { value: 'samarqand_shahar', label: 'Samarqand shahri' },
      { value: 'samarqand_tumani', label: 'Samarqand tumani' },
      { value: 'bulung\'ur', label: 'Bulung\'ur tumani' },
      { value: 'g\'ijduvon', label: 'G\'ijduvon tumani' },
      { value: 'ishtixon', label: 'Ishtixon tumani' },
      { value: 'jomboy', label: 'Jomboy tumani' },
      { value: 'kattaqo\'rg\'on', label: 'Kattaqo\'rg\'on tumani' },
      { value: 'narpay', label: 'Narpay tumani' },
      { value: 'nurobod', label: 'Nurobod tumani' },
      { value: 'oqdaryo', label: 'Oqdaryo tumani' },
      { value: 'paxtachi', label: 'Paxtachi tumani' },
      { value: 'payariq', label: 'Payariq tumani' },
      { value: 'pastdarg\'om', label: 'Pastdarg\'om tumani' },
      { value: 'qo\'shrabot', label: 'Qo\'shrabot tumani' },
      { value: 'toyloq', label: 'Toyloq tumani' },
      { value: 'urgut', label: 'Urgut tumani' }
    ],
    sirdaryo: [
      { value: 'guliston', label: 'Guliston shahri' },
      { value: 'yangiyer', label: 'Yangiyer shahri' },
      { value: 'shirin', label: 'Shirin shahri' },
      { value: 'guliston_tumani', label: 'Guliston tumani' },
      { value: 'boyovut', label: 'Boyovut tumani' },
      { value: 'mirzaobod', label: 'Mirzaobod tumani' },
      { value: 'oqoltin', label: 'Oqoltin tumani' },
      { value: 'sardoba', label: 'Sardoba tumani' },
      { value: 'sayxunobod', label: 'Sayxunobod tumani' },
      { value: 'sirdaryo_tumani', label: 'Sirdaryo tumani' },
      { value: 'xavos', label: 'Xavos tumani' }
    ],
    surxondaryo: [
      { value: 'termiz', label: 'Termiz shahri' },
      { value: 'denov', label: 'Denov shahri' },
      { value: 'surxondaryo_tumani', label: 'Surxondaryo tumani' },
      { value: 'angor', label: 'Angor tumani' },
      { value: 'bandixon', label: 'Bandixon tumani' },
      { value: 'boysun', label: 'Boysun tumani' },
      { value: 'denov_tumani', label: 'Denov tumani' },
      { value: 'jarqo\'rg\'on', label: 'Jarqo\'rg\'on tumani' },
      { value: 'qiziriq', label: 'Qiziriq tumani' },
      { value: 'qo\'mqo\'rg\'on', label: 'Qo\'mqo\'rg\'on tumani' },
      { value: 'muzrabot', label: 'Muzrabot tumani' },
      { value: 'oltinsoy', label: 'Oltinsoy tumani' },
      { value: 'sariosiyo', label: 'Sariosiyo tumani' },
      { value: 'sherobod', label: 'Sherobod tumani' },
      { value: 'sho\'rchi', label: 'Sho\'rchi tumani' },
      { value: 'termiz_tumani', label: 'Termiz tumani' },
      { value: 'uzun', label: 'Uzun tumani' }
    ]
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('uz-UZ').format(price) + ' so\'m';
  };

  const getPerformanceLevel = () => {
    if (stats.successRate >= 95) return { 
      level: 'Elite', 
      color: 'from-yellow-400 to-yellow-600', 
      bgColor: 'bg-yellow-50', 
      textColor: 'text-yellow-600',
      nextLevel: 'Master',
      progress: 100
    };
    if (stats.successRate >= 90) return { 
      level: 'Pro', 
      color: 'from-purple-400 to-purple-600', 
      bgColor: 'bg-purple-50', 
      textColor: 'text-purple-600',
      nextLevel: 'Elite',
      progress: (stats.successRate - 90) * 20
    };
    if (stats.successRate >= 80) return { 
      level: 'Expert', 
      color: 'from-blue-400 to-blue-600', 
      bgColor: 'bg-blue-50', 
      textColor: 'text-blue-600',
      nextLevel: 'Pro',
      progress: (stats.successRate - 80) * 10
    };
    return { 
      level: 'Standard', 
      color: 'from-gray-400 to-gray-600', 
      bgColor: 'bg-gray-50', 
      textColor: 'text-gray-600',
      nextLevel: 'Expert',
      progress: (stats.successRate - 60) * 5
    };
  };

  const performanceLevel = getPerformanceLevel();

  // Asosiy Ma'lumotlar Bo'limi
  const renderInfo = () => (
    <div className="space-y-4 md:space-y-6">
      {/* Enhanced Unified Profile Header - Mobile Optimized */}
      <div className={`bg-gradient-to-r ${performanceLevel.color} rounded-2xl p-4 md:p-6 text-white relative overflow-hidden`}>
        <div className="absolute top-0 right-0 w-20 h-20 md:w-32 md:h-32 bg-white/10 rounded-full -translate-y-8 md:-translate-y-16 translate-x-8 md:translate-x-16"></div>
        <div className="absolute bottom-0 left-0 w-16 h-16 md:w-24 md:h-24 bg-white/5 rounded-full translate-y-8 md:translate-y-12 -translate-x-8 md:-translate-x-12"></div>
        
        <div className="relative z-10">
          {/* Profile Header Section - Mobile First */}
          <div className="flex flex-col md:flex-row md:items-start space-y-4 md:space-y-0 md:space-x-4 mb-4 md:mb-6">
            <div className="flex items-center space-x-4 md:block md:space-x-0">
              <div className="relative flex-shrink-0">
                {isEditing ? (
                  <div className="relative group">
                    <div className="w-20 h-20 md:w-24 md:h-24 bg-white/20 rounded-2xl border-3 border-white/30 shadow-lg flex items-center justify-center cursor-pointer hover:shadow-xl transition-shadow">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => setEditForm(prev => ({ ...prev, avatar: e.target.files?.[0] || null }))}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                      <div className="text-center">
                        <Camera size={20} className="text-white/70 mx-auto mb-1" />
                        <span className="text-xs text-white/60">Rasm</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="relative">
                    <img 
                      src={user.avatar || 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=200'}
                      alt={user.name}
                      className="w-20 h-20 md:w-24 md:h-24 rounded-2xl border-3 border-white/30 object-cover shadow-lg"
                    />
                    <div className="absolute -bottom-1 -right-1 md:-bottom-2 md:-right-2 p-1.5 md:p-2 bg-white/20 backdrop-blur-sm text-white rounded-xl shadow-lg">
                      <Truck size={14} className="md:w-4 md:h-4" />
                    </div>
                    <div className="absolute top-1 right-1 md:top-2 md:right-2 w-3 h-3 md:w-4 md:h-4 bg-green-400 border-2 border-white rounded-full animate-pulse"></div>
                  </div>
                )}
                
                {/* Achievements below profile image - Mobile Hidden, Tablet+ Visible */}
                <div className="hidden md:flex justify-center items-center space-x-1 mt-3">
                  {achievements.slice(0, 5).map(achievement => {
                    const getAchievementIcon = (id: number) => {
                      switch(id) {
                        case 1: return Trophy;
                        case 2: return Zap;
                        case 3: return Star;
                        case 4: return Route;
                        case 5: return Heart;
                        default: return Medal;
                      }
                    };

                    const IconComponent = getAchievementIcon(achievement.id);
                    
                    return (
                      <div key={achievement.id} className={`relative ${
                        achievement.unlocked 
                          ? 'text-white' 
                          : 'text-white/40'
                      }`}>
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                          achievement.unlocked 
                            ? 'bg-white/20 backdrop-blur-sm' 
                            : 'bg-white/10 backdrop-blur-sm'
                        }`}>
                          <IconComponent size={12} />
                        </div>
                        {achievement.unlocked && (
                          <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-400 rounded-full"></div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex-1 md:hidden">
                {isEditing ? (
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={editForm.name}
                      onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                      className="text-lg font-bold bg-white/20 border border-white/30 rounded-lg px-3 py-2 text-white placeholder-white/60 focus:border-white/50 outline-none w-full backdrop-blur-sm"
                      placeholder="Ismingiz"
                    />
                  </div>
                ) : (
                  <div>
                    <div className="flex items-center space-x-2 mb-1">
                      <h2 className="text-lg font-bold text-white">{user.name}</h2>
                      <BadgeCheck size={16} className="text-white/80" />
                    </div>
                    <div className="flex items-center space-x-1 mb-2">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                      <span className="text-xs text-white/80">Online</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex-1">
              {isEditing ? (
                <div className="hidden md:block space-y-3">
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                    className="text-xl font-bold bg-white/20 border border-white/30 rounded-lg px-3 py-2 text-white placeholder-white/60 focus:border-white/50 outline-none w-full backdrop-blur-sm"
                    placeholder="Ismingiz"
                  />
                </div>
              ) : (
                <div className="hidden md:block">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <h2 className="text-xl lg:text-2xl font-bold text-white">{user.name}</h2>
                    <div className="flex items-center space-x-1 px-2 py-1 bg-white/20 backdrop-blur-sm text-white rounded-full text-xs font-medium">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                      <span>Online</span>
                    </div>
                    <BadgeCheck size={18} className="text-white/80" />
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-white/20 backdrop-blur-sm text-white">
                      {performanceLevel.level} Kuryer
                    </span>
                    <div className="flex items-center space-x-1">
                      <Star size={12} className="fill-current text-yellow-300" />
                      <span className="text-xs font-bold text-white">{stats.averageRating.toFixed(1)}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Clock size={12} className="text-white/70" />
                      <span className="text-xs text-white/90">{stats.averageDeliveryTime} min</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 text-xs text-white/70 mb-3">
                    <span className="flex items-center space-x-1">
                      <Calendar size={10} />
                      <span>{new Date(user.joinDate).toLocaleDateString('uz-UZ')} dan</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <Route size={10} />
                      <span>{stats.totalDistance} km</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <Shield size={10} />
                      <span>Tasdiqlangan</span>
                    </span>
                  </div>

                  {(user.deliveryRegion || user.deliveryDistrict) && (
                    <div className="flex items-center space-x-2 text-xs bg-white/20 backdrop-blur-sm text-white px-2 py-1 rounded-lg">
                      <MapPin size={10} />
                      <span className="truncate">
                        {regions.find(r => r.value === user.deliveryRegion)?.label}
                        {user.deliveryDistrict && districts[user.deliveryRegion] && 
                          ` - ${districts[user.deliveryRegion].find(d => d.value === user.deliveryDistrict)?.label}`
                        }
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex-shrink-0 flex items-center justify-center space-x-1 md:space-x-2 px-3 md:px-4 py-2 rounded-xl text-xs md:text-sm font-medium bg-white/10 backdrop-blur-sm text-white/60">
              <Eye size={14} />
              <span className="hidden sm:inline">Ko'rish</span>
            </div>
          </div>

          {/* Mobile Status Info */}
          <div className="flex flex-wrap items-center gap-2 mb-4 md:hidden">
            <span className="px-2 py-1 rounded-full text-xs font-medium bg-white/20 backdrop-blur-sm text-white">
              {performanceLevel.level} Kuryer
            </span>
            <div className="flex items-center space-x-1">
              <Star size={12} className="fill-current text-yellow-300" />
              <span className="text-xs font-bold text-white">{stats.averageRating.toFixed(1)}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Clock size={12} className="text-white/70" />
              <span className="text-xs text-white/90">{stats.averageDeliveryTime} min</span>
            </div>
          </div>

          {/* Mobile Achievements */}
          <div className="flex justify-center items-center space-x-2 mb-4 md:hidden">
            {achievements.slice(0, 5).map(achievement => {
              const getAchievementIcon = (id: number) => {
                switch(id) {
                  case 1: return Trophy;
                  case 2: return Zap;
                  case 3: return Star;
                  case 4: return Route;
                  case 5: return Heart;
                  default: return Medal;
                }
              };

              const IconComponent = getAchievementIcon(achievement.id);
              
              return (
                <div key={achievement.id} className={`relative ${
                  achievement.unlocked 
                    ? 'text-white' 
                    : 'text-white/40'
                }`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    achievement.unlocked 
                      ? 'bg-white/20 backdrop-blur-sm' 
                      : 'bg-white/10 backdrop-blur-sm'
                  }`}>
                    <IconComponent size={14} />
                  </div>
                  {achievement.unlocked && (
                    <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-green-400 rounded-full"></div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Performance Level Progress - Mobile Optimized */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0 mb-4 md:mb-6">
            <div>
              <h3 className="text-base md:text-lg font-semibold text-white/90">Professional daraja</h3>
              <p className="text-white/70 text-xs md:text-sm">Keyingi: {performanceLevel.nextLevel}</p>
            </div>
            <div className="text-left sm:text-right">
              <div className="w-full sm:w-32 bg-white/20 rounded-full h-2.5 md:h-3 mb-1">
                <div 
                  className="bg-white h-2.5 md:h-3 rounded-full transition-all duration-500" 
                  style={{width: `${Math.min(performanceLevel.progress, 100)}%`}}
                ></div>
              </div>
              <span className="text-xs text-white/70">{Math.round(performanceLevel.progress)}% progress</span>
            </div>
          </div>
          
          {/* Unified Stats Grid - Mobile Optimized */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            <div className="text-center p-3 md:p-4 bg-white/10 rounded-xl backdrop-blur-sm">
              <Package size={20} className="text-white mx-auto mb-2" />
              <div className="text-xl md:text-2xl font-bold text-white">{stats.totalDeliveries}</div>
              <div className="text-xs text-white/70">Jami yetkazish</div>
              <div className="text-base md:text-lg font-bold text-white mt-1">{stats.todayDeliveries}</div>
              <div className="text-xs text-white/60">Bugun</div>
            </div>
            
            <div className="text-center p-3 md:p-4 bg-white/10 rounded-xl backdrop-blur-sm">
              <Star size={20} className="text-white mx-auto mb-2" />
              <div className="text-xl md:text-2xl font-bold text-white">{stats.averageRating.toFixed(1)}</div>
              <div className="text-xs text-white/70">Reyting</div>
              <div className="text-base md:text-lg font-bold text-white mt-1">{stats.customerSatisfaction}%</div>
              <div className="text-xs text-white/60">Mamnunlik</div>
            </div>
            
            <div className="text-center p-3 md:p-4 bg-white/10 rounded-xl backdrop-blur-sm">
              <Trophy size={20} className="text-white mx-auto mb-2" />
              <div className="text-xl md:text-2xl font-bold text-white">{stats.successRate}%</div>
              <div className="text-xs text-white/70">Muvaffaqiyat</div>
              <div className="text-base md:text-lg font-bold text-white mt-1">{stats.onTimeRate}%</div>
              <div className="text-xs text-white/60">Muddatda</div>
            </div>
            
            <div className="text-center p-3 md:p-4 bg-white/10 rounded-xl backdrop-blur-sm">
              <DollarSign size={20} className="text-white mx-auto mb-2" />
              <div className="text-lg md:text-xl font-bold text-white leading-tight">{formatPrice(stats.totalEarnings)}</div>
              <div className="text-xs text-white/70">Jami daromad</div>
              <div className="text-sm md:text-lg font-bold text-white mt-1 leading-tight">{formatPrice(stats.todayEarnings)}</div>
              <div className="text-xs text-white/60">Bugun</div>
            </div>
          </div>

          
        </div>
      </div>

      {/* Read-only Profile Details - Mobile Optimized */}
      <div className="bg-white rounded-2xl p-4 md:p-6 border border-slate-200 shadow-sm">
        <h3 className="text-base md:text-lg font-semibold text-slate-900 mb-4 flex items-center space-x-2">
          <User size={20} className="text-slate-600" />
          <span>Shaxsiy ma'lumotlar</span>
        </h3>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-3 bg-slate-50 rounded-lg">
              <label className="block text-sm font-medium text-slate-600 mb-1">Telefon raqam</label>
              <div className="flex items-center space-x-2">
                <Phone size={16} className="text-slate-400" />
                <span className="text-slate-900">{user.phone || 'Kiritilmagan'}</span>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg">
              <label className="block text-sm font-medium text-slate-600 mb-1">Email manzil</label>
              <div className="flex items-center space-x-2">
                <Mail size={16} className="text-slate-400" />
                <span className="text-slate-900">{user.email || 'Kiritilmagan'}</span>
              </div>
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg">
            <label className="block text-sm font-medium text-slate-600 mb-1">Yashash manzili</label>
            <div className="flex items-start space-x-2">
              <MapPin size={16} className="text-slate-400 mt-0.5" />
              <span className="text-slate-900">{user.address || 'Kiritilmagan'}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-3 bg-slate-50 rounded-lg">
              <label className="block text-sm font-medium text-slate-600 mb-1">Transport turi</label>
              <div className="flex items-center space-x-2">
                <Truck size={16} className="text-slate-400" />
                <span className="text-slate-900">
                  {vehicleTypes.find(t => t.value === user.vehicleType)?.label || 'Kiritilmagan'}
                </span>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg">
              <label className="block text-sm font-medium text-slate-600 mb-1">Transport raqami</label>
              <span className="text-slate-900">{user.vehicleNumber || 'Kiritilmagan'}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-3 bg-slate-50 rounded-lg">
              <label className="block text-sm font-medium text-slate-600 mb-1">Hudud</label>
              <span className="text-slate-900">
                {regions.find(r => r.value === user.deliveryRegion)?.label || 'Kiritilmagan'}
              </span>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg">
              <label className="block text-sm font-medium text-slate-600 mb-1">Tuman</label>
              <span className="text-slate-900">
                {user.deliveryDistrict && districts[user.deliveryRegion] 
                  ? districts[user.deliveryRegion].find(d => d.value === user.deliveryDistrict)?.label 
                  : 'Kiritilmagan'
                }
              </span>
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg">
            <label className="block text-sm font-medium text-slate-600 mb-1">Favqulodda aloqa</label>
            <div className="flex items-center space-x-2">
              <Phone size={16} className="text-slate-400" />
              <span className="text-slate-900">{user.emergencyContact || 'Kiritilmagan'}</span>
            </div>
          </div>

          <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center space-x-2 text-blue-700">
              <Settings size={16} />
              <span className="text-sm font-medium">Ma'lumotlarni o'zgartirish uchun "Sozlamalar" bo'limiga o'ting</span>
            </div>
          </div>
        </div>
      </div>

      

      
    </div>
  );

  // Kengaytirilgan Statistika Bo'limi
  const renderStats = () => (
    <div className="space-y-6">
      {/* Performance Overview */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
        <h4 className="font-semibold text-slate-900 mb-4">Asosiy ko'rsatkichlar</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl">
            <Package size={24} className="text-blue-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-slate-900">{stats.totalDeliveries}</p>
            <p className="text-xs text-slate-600">Jami yetkazish</p>
            <div className="flex items-center justify-center space-x-1 mt-1">
              <TrendingUp size={12} className="text-green-500" />
              <span className="text-xs text-green-600">+12%</span>
            </div>
          </div>
          
          <div className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-xl">
            <Coins size={24} className="text-green-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-slate-900">{formatPrice(stats.totalEarnings)}</p>
            <p className="text-xs text-slate-600">Jami daromad</p>
            <div className="flex items-center justify-center space-x-1 mt-1">
              <TrendingUp size={12} className="text-green-500" />
              <span className="text-xs text-green-600">+8%</span>
            </div>
          </div>
          
          <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl">
            <Clock3 size={24} className="text-purple-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-slate-900">{stats.averageDeliveryTime}</p>
            <p className="text-xs text-slate-600">O'rtacha vaqt (min)</p>
            <div className="flex items-center justify-center space-x-1 mt-1">
              <TrendingDown size={12} className="text-green-500" />
              <span className="text-xs text-green-600">-5%</span>
            </div>
          </div>
          
          <div className="text-center p-4 bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl">
            <Trophy size={24} className="text-yellow-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-slate-900">{stats.successRate}%</p>
            <p className="text-xs text-slate-600">Muvaffaqiyat</p>
            <div className="flex items-center justify-center space-x-1 mt-1">
              <TrendingUp size={12} className="text-green-500" />
              <span className="text-xs text-green-600">+3%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Performance Metrics */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
          <h4 className="font-semibold text-slate-900 mb-4">Ish samaradorligi</h4>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <Gauge size={16} className="text-blue-500" />
                <span className="text-sm text-slate-600">Muddatda yetkazish</span>
              </div>
              <div className="text-right">
                <span className="font-bold text-slate-900">{stats.onTimeRate}%</span>
                <div className="w-20 bg-slate-200 rounded-full h-1.5">
                  <div 
                    className="bg-blue-500 h-1.5 rounded-full" 
                    style={{width: `${stats.onTimeRate}%`}}
                  ></div>
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <ThumbsUp size={16} className="text-green-500" />
                <span className="text-sm text-slate-600">Mijoz mamnunligi</span>
              </div>
              <div className="text-right">
                <span className="font-bold text-slate-900">{stats.customerSatisfaction}%</span>
                <div className="w-20 bg-slate-200 rounded-full h-1.5">
                  <div 
                    className="bg-green-500 h-1.5 rounded-full" 
                    style={{width: `${stats.customerSatisfaction}%`}}
                  ></div>
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <Fuel size={16} className="text-orange-500" />
                <span className="text-sm text-slate-600">Yonilg'i samaradorligi</span>
              </div>
              <div className="text-right">
                <span className="font-bold text-slate-900">{stats.fuelEfficiency}%</span>
                <div className="w-20 bg-slate-200 rounded-full h-1.5">
                  <div 
                    className="bg-orange-500 h-1.5 rounded-full" 
                    style={{width: `${stats.fuelEfficiency}%`}}
                  ></div>
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <Star size={16} className="text-yellow-500" />
                <span className="text-sm text-slate-600">O'rtacha reyting</span>
              </div>
              <div className="text-right">
                <span className="font-bold text-slate-900">{stats.averageRating.toFixed(1)}/5.0</span>
                <div className="flex space-x-0.5">
                  {[1,2,3,4,5].map(star => (
                    <Star 
                      key={star} 
                      size={12} 
                      className={`${star <= Math.floor(stats.averageRating) ? 'fill-current text-yellow-500' : 'text-slate-300'}`} 
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Earnings Breakdown */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
          <h4 className="font-semibold text-slate-900 mb-4">Daromad taqsimoti</h4>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-600">Bugungi daromad</span>
              <span className="font-bold text-green-600">{formatPrice(stats.todayEarnings)}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-600">Haftalik daromad</span>
              <span className="font-bold text-slate-900">{formatPrice(stats.todayEarnings * 6)}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-600">Oylik daromad</span>
              <span className="font-bold text-slate-900">{formatPrice(stats.monthlyEarnings)}</span>
            </div>

            <div className="pt-3 border-t border-slate-200">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-slate-600">Buyurtma uchun</span>
                <span className="text-sm font-medium">{formatPrice(stats.totalEarnings * 0.7)}</span>
              </div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-slate-600">Bonus va mukofotlar</span>
                <span className="text-sm font-medium">{formatPrice(stats.totalEarnings * 0.2)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600">Qo'shimcha xizmatlar</span>
                <span className="text-sm font-medium">{formatPrice(stats.totalEarnings * 0.1)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Weekly Stats */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
        <h4 className="font-semibold text-slate-900 mb-4">Haftalik statistika</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-3 bg-slate-50 rounded-lg">
            <p className="text-2xl font-bold text-slate-900">{stats.weeklyDeliveries}</p>
            <p className="text-xs text-slate-600">Yetkazish soni</p>
          </div>
          <div className="text-center p-3 bg-slate-50 rounded-lg">
            <p className="text-2xl font-bold text-slate-900">{stats.weeklyHours}</p>
            <p className="text-xs text-slate-600">Ish soatlari</p>
          </div>
          <div className="text-center p-3 bg-slate-50 rounded-lg">
            <p className="text-2xl font-bold text-slate-900">{Math.round(stats.totalDistance/4)}</p>
            <p className="text-xs text-slate-600">Bosib o'tilgan (km)</p>
          </div>
          <div className="text-center p-3 bg-slate-50 rounded-lg">
            <p className="text-2xl font-bold text-slate-900">{Math.round(stats.weeklyDeliveries/7)}</p>
            <p className="text-xs text-slate-600">Kunlik o'rtacha</p>
          </div>
        </div>
      </div>
    </div>
  );

  // Kengaytirilgan Sozlamalar Bo'limi
  const renderSettings = () => (
    <div className="space-y-6">
      {/* Work Settings */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
        <h4 className="font-semibold text-slate-900 mb-4">Ish sozlamalari</h4>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-lg transition-colors">
            <div className="flex items-center space-x-3">
              <Bell size={20} className="text-slate-600" />
              <div>
                <span className="text-sm font-medium text-slate-900">Bildirishnomalar</span>
                <p className="text-xs text-slate-500">Yangi buyurtmalar haqida xabar olish</p>
              </div>
            </div>
            <button
              onClick={() => setSettings(prev => ({...prev, notifications: !prev.notifications}))}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.notifications ? 'bg-indigo-600' : 'bg-slate-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.notifications ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-lg transition-colors">
            <div className="flex items-center space-x-3">
              <Zap size={20} className="text-slate-600" />
              <div>
                <span className="text-sm font-medium text-slate-900">Avtomatik qabul</span>
                <p className="text-xs text-slate-500">Buyurtmalarni avtomatik qabul qilish</p>
              </div>
            </div>
            <button
              onClick={() => setSettings(prev => ({...prev, autoAcceptOrders: !prev.autoAcceptOrders}))}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.autoAcceptOrders ? 'bg-indigo-600' : 'bg-slate-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.autoAcceptOrders ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          <div className="p-3 hover:bg-slate-50 rounded-lg transition-colors">
            <label className="block text-sm font-medium text-slate-900 mb-2">Soatlik maksimal buyurtmalar</label>
            <input
              type="number"
              min="1"
              max="10"
              value={settings.maxOrdersPerHour}
              onChange={(e) => setSettings(prev => ({...prev, maxOrdersPerHour: parseInt(e.target.value)}))}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="p-3 hover:bg-slate-50 rounded-lg transition-colors">
            <label className="block text-sm font-medium text-slate-900 mb-2">Ish vaqti</label>
            <input
              type="text"
              value={settings.workingHours}
              onChange={(e) => setSettings(prev => ({...prev, workingHours: e.target.value}))}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              placeholder="Masalan: 9:00-18:00"
            />
          </div>

          <div className="p-3 hover:bg-slate-50 rounded-lg transition-colors">
            <label className="block text-sm font-medium text-slate-900 mb-2">Ish kunlari</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                {key: 'monday', label: 'Dush'},
                {key: 'tuesday', label: 'Sesh'},
                {key: 'wednesday', label: 'Chor'},
                {key: 'thursday', label: 'Pay'},
                {key: 'friday', label: 'Juma'},
                {key: 'saturday', label: 'Shan'}
              ].map(day => (
                <button
                  key={day.key}
                  onClick={() => {
                    const newDays = settings.workingDays.includes(day.key)
                      ? settings.workingDays.filter(d => d !== day.key)
                      : [...settings.workingDays, day.key];
                    setSettings(prev => ({...prev, workingDays: newDays}));
                  }}
                  className={`p-2 text-xs rounded-lg transition-colors ${
                    settings.workingDays.includes(day.key)
                      ? 'bg-indigo-100 text-indigo-700 border border-indigo-300'
                      : 'bg-slate-100 text-slate-600 border border-slate-300'
                  }`}
                >
                  {day.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Payment Preferences */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
        <h4 className="font-semibold text-slate-900 mb-4">To'lov sozlamalari</h4>
        <div className="space-y-3">
          <div className="p-3 hover:bg-slate-50 rounded-lg transition-colors">
            <label className="block text-sm font-medium text-slate-900 mb-2">Qabul qilinadigan to'lov turlari</label>
            <div className="space-y-2">
              {[
                {key: 'cash', label: 'Naqd pul', icon: '💵'},
                {key: 'card', label: 'Bank kartasi', icon: '💳'},
                {key: 'click', label: 'Click', icon: '🔵'},
                {key: 'payme', label: 'Payme', icon: '🟢'}
              ].map(method => (
                <label key={method.key} className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.preferredPaymentMethods.includes(method.key)}
                    onChange={(e) => {
                      const newMethods = e.target.checked
                        ? [...settings.preferredPaymentMethods, method.key]
                        : settings.preferredPaymentMethods.filter(m => m !== method.key);
                      setSettings(prev => ({...prev, preferredPaymentMethods: newMethods}));
                    }}
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-sm">{method.icon} {method.label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* App Settings */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
        <h4 className="font-semibold text-slate-900 mb-4">Ilova sozlamalari</h4>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Til</label>
            <select
              value={settings.language}
              onChange={(e) => setSettings(prev => ({...prev, language: e.target.value}))}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            >
              <option value="uz">🇺🇿 O'zbekcha</option>
              <option value="ru">🇷🇺 Русский</option>
              <option value="en">🇺🇸 English</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Mavzu</label>
            <select
              value={settings.theme}
              onChange={(e) => setSettings(prev => ({...prev, theme: e.target.value}))}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            >
              <option value="light">☀️ Yorug'</option>
              <option value="dark">🌙 Qorong'i</option>
              <option value="auto">🔄 Avtomatik</option>
            </select>
          </div>
        </div>
      </div>

      {/* Help & Support */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
        <h4 className="font-semibold text-slate-900 mb-4">Yordam va qo'llab-quvvatlash</h4>
        <div className="space-y-2">
          <button className="w-full flex items-center justify-between p-3 hover:bg-slate-50 rounded-lg transition-colors">
            <div className="flex items-center space-x-3">
              <Phone size={18} className="text-slate-600" />
              <span className="text-sm text-slate-700">Qo'llab-quvvatlash xizmati</span>
            </div>
            <ChevronRight size={16} className="text-slate-400" />
          </button>
          
          <button className="w-full flex items-center justify-between p-3 hover:bg-slate-50 rounded-lg transition-colors">
            <div className="flex items-center space-x-3">
              <MessageCircle size={18} className="text-slate-600" />
              <span className="text-sm text-slate-700">Chat yordami</span>
            </div>
            <ChevronRight size={16} className="text-slate-400" />
          </button>
          
          <button className="w-full flex items-center justify-between p-3 hover:bg-slate-50 rounded-lg transition-colors">
            <div className="flex items-center space-x-3">
              <HelpCircle size={18} className="text-slate-600" />
              <span className="text-sm text-slate-700">Ko'p so'raladigan savollar</span>
            </div>
            <ChevronRight size={16} className="text-slate-400" />
          </button>

          <button className="w-full flex items-center justify-between p-3 hover:bg-slate-50 rounded-lg transition-colors">
            <div className="flex items-center space-x-3">
              <Download size={18} className="text-slate-600" />
              <span className="text-sm text-slate-700">Ma'lumotlar eksporti</span>
            </div>
            <ChevronRight size={16} className="text-slate-400" />
          </button>
        </div>
      </div>

      {/* Security */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
        <h4 className="font-semibold text-slate-900 mb-4">Xavfsizlik</h4>
        <div className="space-y-2">
          <button className="w-full flex items-center justify-between p-3 hover:bg-slate-50 rounded-lg transition-colors">
            <div className="flex items-center space-x-3">
              <Lock size={18} className="text-slate-600" />
              <span className="text-sm text-slate-700">Parolni o'zgartirish</span>
            </div>
            <ChevronRight size={16} className="text-slate-400" />
          </button>
          
          <button className="w-full flex items-center justify-between p-3 hover:bg-slate-50 rounded-lg transition-colors">
            <div className="flex items-center space-x-3">
              <ShieldCheck size={18} className="text-slate-600" />
              <span className="text-sm text-slate-700">Ikki bosqichli tasdiqlash</span>
            </div>
            <ChevronRight size={16} className="text-slate-400" />
          </button>

          <button className="w-full flex items-center justify-between p-3 hover:bg-slate-50 rounded-lg transition-colors">
            <div className="flex items-center space-x-3">
              <Activity size={18} className="text-slate-600" />
              <span className="text-sm text-slate-700">Login tarixi</span>
            </div>
            <ChevronRight size={16} className="text-slate-400" />
          </button>
        </div>
      </div>
    </div>
  );

  const navigationSections = [
    { id: 'info', label: 'Ma\'lumotlar', icon: User },
    { id: 'stats', label: 'Statistika', icon: BarChart3 },
    { id: 'settings', label: 'Sozlamalar', icon: Settings }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 pb-20">
      {/* Tab Navigation - Mobile Optimized */}
      <div className="px-3 md:px-4 py-3 md:py-4 sticky top-0 z-10 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="bg-white/95 backdrop-blur-sm rounded-xl md:rounded-2xl p-1 md:p-1.5 shadow-lg border border-white/30 max-w-7xl mx-auto">
          <div className="grid grid-cols-3 gap-1">
            {navigationSections.map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`flex flex-col sm:flex-row items-center justify-center space-y-1 sm:space-y-0 sm:space-x-2 py-2 md:py-3 px-2 md:px-4 rounded-lg md:rounded-xl font-medium transition-all duration-300 ${
                  activeSection === section.id
                    ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg scale-105'
                    : 'text-slate-600 hover:bg-slate-100 hover:scale-105'
                }`}
              >
                <section.icon size={16} className="sm:w-4 sm:h-4 md:w-5 md:h-5" />
                <span className="text-xs sm:text-sm font-medium">{section.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-3 md:px-4 max-w-7xl mx-auto">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin h-8 w-8 border-4 border-indigo-500 border-t-transparent rounded-full"></div>
          </div>
        ) : (
          <>
            {activeSection === 'info' && renderInfo()}
            {activeSection === 'stats' && renderStats()}
            {activeSection === 'settings' && renderSettings()}
          </>
        )}
      </div>
    </div>
  );
};

export default CourierProfile;
