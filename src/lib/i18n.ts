export interface Language {
  code: string;
  name: string;
  nativeName: string;
}

export const LANGUAGES: Language[] = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिंदी' },
  { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ' },
];

export const translations = {
  en: {
    // Navigation & Header
    appName: 'Vyapaar Saathi AI',
    dashboard: 'Dashboard',
    sales: 'Sales',
    inventory: 'Inventory',
    finance: 'Finance',
    promote: 'Promote',
    chatbot: 'AI Assistant',
    settings: 'Settings',
    logout: 'Logout',
    
    // Business Types
    selectBusinessType: 'Select Your Business Type',
    barber: 'Barber Shop',
    grocery: 'Kirana Store',
    hotel: 'Hotel/Restaurant',
    clothing: 'Clothing Store',
    
    // Dashboard
    todaySales: "Today's Sales",
    totalRevenue: 'Total Revenue',
    lowStock: 'Low Stock Items',
    pendingPayments: 'Pending Payments',
    
    // AI Chatbot
    askAI: 'Ask AI Assistant',
    helpPlaceholder: 'Ask me anything about your business...',
    
    // Common
    welcome: 'Welcome to',
    getStarted: 'Get Started',
    save: 'Save',
    cancel: 'Cancel',
    add: 'Add',
    edit: 'Edit',
    delete: 'Delete',
    view: 'View',
    loading: 'Loading...',
  },
  hi: {
    // Navigation & Header
    appName: 'व्यापार साथी AI',
    dashboard: 'डैशबोर्ड',
    sales: 'बिक्री',
    inventory: 'इन्वेंटरी',
    finance: 'वित्त',
    promote: 'प्रचार',
    chatbot: 'AI सहायक',
    settings: 'सेटिंग्स',
    logout: 'लॉगआउट',
    
    // Business Types
    selectBusinessType: 'अपना व्यापार प्रकार चुनें',
    barber: 'नाई की दुकान',
    grocery: 'किराना स्टोर',
    hotel: 'होटल/रेस्टोरेंट',
    clothing: 'कपड़े की दुकान',
    
    // Dashboard
    todaySales: 'आज की बिक्री',
    totalRevenue: 'कुल आय',
    lowStock: 'कम स्टॉक आइटम',
    pendingPayments: 'लंबित भुगतान',
    
    // AI Chatbot
    askAI: 'AI सहायक से पूछें',
    helpPlaceholder: 'अपने व्यापार के बारे में कुछ भी पूछें...',
    
    // Common
    welcome: 'स्वागत है',
    getStarted: 'शुरू करें',
    save: 'सेव करें',
    cancel: 'रद्द करें',
    add: 'जोड़ें',
    edit: 'संपादित करें',
    delete: 'हटाएं',
    view: 'देखें',
    loading: 'लोड हो रहा है...',
  },
  kn: {
    // Navigation & Header
    appName: 'ವ್ಯಾಪಾರ ಸಾಥಿ AI',
    dashboard: 'ಡ್ಯಾಶ್‌ಬೋರ್ಡ್',
    sales: 'ಮಾರಾಟ',
    inventory: 'ದಾಸ್ತಾನು',
    finance: 'ಹಣಕಾಸು',
    promote: 'ಪ್ರಚಾರ',
    chatbot: 'AI ಸಹಾಯಕ',
    settings: 'ಸೆಟ್ಟಿಂಗ್‌ಗಳು',
    logout: 'ಲಾಗ್ಔಟ್',
    
    // Business Types
    selectBusinessType: 'ನಿಮ್ಮ ವ್ಯಾಪಾರದ ಪ್ರಕಾರವನ್ನು ಆಯ್ಕೆ ಮಾಡಿ',
    barber: 'ಕ್ಷೌರ ಮನೆ',
    grocery: 'ಕಿರಾಣಿ ಅಂಗಡಿ',
    hotel: 'ಹೋಟೆಲ್/ರೆಸ್ಟೋರೆಂಟ್',
    clothing: 'ಬಟ್ಟೆ ಅಂಗಡಿ',
    
    // Dashboard
    todaySales: 'ಇಂದಿನ ಮಾರಾಟ',
    totalRevenue: 'ಒಟ್ಟು ಆದಾಯ',
    lowStock: 'ಕಡಿಮೆ ಸ್ಟಾಕ್ ವಸ್ತುಗಳು',
    pendingPayments: 'ಬಾಕಿ ಪಾವತಿಗಳು',
    
    // AI Chatbot
    askAI: 'AI ಸಹಾಯಕನನ್ನು ಕೇಳಿ',
    helpPlaceholder: 'ನಿಮ್ಮ ವ್ಯಾಪಾರದ ಬಗ್ಗೆ ಏನಾದರೂ ಕೇಳಿ...',
    
    // Common
    welcome: 'ಸ್ವಾಗತ',
    getStarted: 'ಪ್ರಾರಂಭಿಸಿ',
    save: 'ಉಳಿಸಿ',
    cancel: 'ರದ್ದುಮಾಡಿ',
    add: 'ಸೇರಿಸಿ',
    edit: 'ಸಂಪಾದಿಸಿ',
    delete: 'ಅಳಿಸಿ',
    view: 'ವೀಕ್ಷಿಸಿ',
    loading: 'ಲೋಡ್ ಆಗುತ್ತಿದೆ...',
  },
} as const;

export type TranslationKey = keyof typeof translations.en;
export type LanguageCode = keyof typeof translations;