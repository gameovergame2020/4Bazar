# Tort Bazar - Firebase Integration

Tort Bazar loyihasi Firebase bilan to'liq integratsiya qilingan.

## Firebase Xizmatlar

### 1. Authentication
- Telefon raqam orqali ro'yhatdan o'tish va kirish
- Parolni tiklash
- Foydalanuvchi sessiyalarini boshqarish

### 2. Firestore Database
- Foydalanuvchilar ma'lumotlari
- Tortlar katalogi
- Buyurtmalar tizimi
- Sharhlar va reytinglar
- Sevimlilar ro'yxati

### 3. Storage
- Tort rasmlari
- Foydalanuvchi avatar rasmlari
- Boshqa media fayllar

### 4. Analytics
- Foydalanuvchi faoliyati
- Buyurtmalar statistikasi

## O'rnatish

1. Firebase loyihasini yarating: https://console.firebase.google.com
2. `.env` faylini yarating va Firebase konfiguratsiyasini qo'shing:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

3. Firebase CLI o'rnating:
```bash
npm install -g firebase-tools
```

4. Firebase loyihasiga ulanish:
```bash
firebase login
firebase init
```

5. Loyihani ishga tushirish:
```bash
npm install
npm run dev
```

## Deploy qilish

```bash
npm run build
firebase deploy
```

## Xususiyatlar

- ✅ Real-time ma'lumotlar yangilanishi
- ✅ Xavfsiz autentifikatsiya
- ✅ Scalable database
- ✅ File upload va storage
- ✅ Offline qo'llab-quvvatlash
- ✅ Analytics va monitoring
