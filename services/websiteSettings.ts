import { db } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export interface WebsiteSettings {
  // Logo & Title
  siteLogo: string;
  siteTitle: string;
  
  // Hero Section
  heroTitle: string;
  heroSubtitle: string;
  heroDescription: string;
  heroImage: string;
  heroButtonText: string;

  // Brand Section
  brandQuote: string;
  brandTagline: string;

  // Contact Information
  contactEmail1: string;
  contactEmail2: string;
  contactPhone: string;
  contactPhoneDisplay: string;
  contactAddress: string;
  contactCity: string;
  contactState: string;
  contactZip: string;
  contactCountry: string;

  // Business Hours
  mondayFriday: string;
  saturday: string;
  sunday: string;
  holidays: string;

  // Featured Products Section
  featuredTitle: string;
  featuredSubtitle: string;

  // Categories Section
  categoriesTitle: string;
  categoriesSubtitle: string;

  // Contact Section
  contactTitle: string;
  contactDescription: string;

  // SEO & Meta
  siteDescription: string;
  siteKeywords: string;

  // Social Media
  facebook: string;
  instagram: string;
  twitter: string;
  pinterest: string;

  // Cache management
  lastUpdated: number;
  version: string;
}

const DEFAULT_SETTINGS: WebsiteSettings = {
  // Logo & Title
  siteLogo: "https://images.unsplash.com/photo-1495521821757-a1efb6729352?q=80&w=300&auto=format&fit=crop",
  siteTitle: "Wisania - Women's Fashion",
  
  // Hero Section
  heroTitle: "Elegance is \nan attitude.",
  heroSubtitle: "New Season Collection",
  heroDescription: "Discover Wisania's exclusive selection of women's wear. Timeless cuts, premium fabrics, and sophistication for the modern woman.",
  heroImage: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=2070&auto=format&fit=crop",
  heroButtonText: "Shop Now",

  // Brand Section
  brandQuote: "Simplicity is the keynote of all true elegance.",
  brandTagline: "Wisania Women's Collection 2025",

  // Contact Information
  contactEmail1: "contact@wisania.com",
  contactEmail2: "support@wisania.com",
  contactPhone: "+919876543210",
  contactPhoneDisplay: "+91 98765 43210",
  contactAddress: "123 Fashion Street",
  contactCity: "Bandra West, Mumbai",
  contactState: "Maharashtra",
  contactZip: "400050",
  contactCountry: "India",

  // Business Hours
  mondayFriday: "10:00 AM - 8:00 PM IST",
  saturday: "10:00 AM - 6:00 PM IST",
  sunday: "Closed",
  holidays: "Closed",

  // Featured Products Section
  featuredTitle: "Featured Products",
  featuredSubtitle: "Handpicked items just for you",

  // Categories Section
  categoriesTitle: "Curated Categories",
  categoriesSubtitle: "Explore our most popular collections",

  // Contact Section
  contactTitle: "Get in Touch",
  contactDescription: "Have a question or need assistance? We're here to help. Reach out and we'll get back to you as soon as possible.",

  // SEO & Meta
  siteDescription: "Discover Wisania's exclusive collection of women's wear. Timeless elegance meets modern sophistication.",
  siteKeywords: "women's fashion, clothing, dresses, luxury wear, wisania",

  // Social Media
  facebook: "",
  instagram: "",
  twitter: "",
  pinterest: "",

  // Cache management
  lastUpdated: Date.now(),
  version: generateHash()
};

// Generate a unique hash for cache busting
function generateHash(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// LocalStorage cache key
const CACHE_KEY = 'wisania_website_settings';
const CACHE_VERSION_KEY = 'wisania_settings_version';

// Get settings from localStorage cache
function getCachedSettings(): WebsiteSettings | null {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      return JSON.parse(cached);
    }
  } catch (error) {
    console.error('Error reading cache:', error);
  }
  return null;
}

// Save settings to localStorage cache
function setCachedSettings(settings: WebsiteSettings): void {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(settings));
    localStorage.setItem(CACHE_VERSION_KEY, settings.version);
  } catch (error) {
    console.error('Error writing cache:', error);
  }
}

// Get settings from Firestore or cache
export async function getWebsiteSettings(): Promise<WebsiteSettings> {
  try {
    // Try cache first
    const cached = getCachedSettings();
    
    // Get from Firestore
    const docRef = doc(db, 'settings', 'website');
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const settings = docSnap.data() as WebsiteSettings;
      
      // If cached version matches, return cache
      if (cached && cached.version === settings.version) {
        return cached;
      }
      
      // Update cache with new version
      setCachedSettings(settings);
      return settings;
    } else {
      // No settings in Firestore, create default
      const defaultSettings = { ...DEFAULT_SETTINGS };
      await setDoc(docRef, defaultSettings);
      setCachedSettings(defaultSettings);
      return defaultSettings;
    }
  } catch (error) {
    console.error('Error fetching website settings:', error);
    // Return cached version if available
    const cached = getCachedSettings();
    if (cached) return cached;
    return DEFAULT_SETTINGS;
  }
}

// Update settings in Firestore and cache
export async function updateWebsiteSettings(settings: Partial<WebsiteSettings>): Promise<void> {
  try {
    const docRef = doc(db, 'settings', 'website');
    
    // Generate new version hash
    const newVersion = generateHash();
    const updatedSettings: WebsiteSettings = {
      ...settings as WebsiteSettings,
      lastUpdated: Date.now(),
      version: newVersion
    };
    
    await setDoc(docRef, updatedSettings, { merge: true });
    
    // Update cache
    const fullSettings = await getDoc(docRef);
    if (fullSettings.exists()) {
      const data = fullSettings.data() as WebsiteSettings;
      setCachedSettings(data);
    }
  } catch (error) {
    console.error('Error updating website settings:', error);
    throw error;
  }
}

// Clear cache (useful for debugging)
export function clearSettingsCache(): void {
  localStorage.removeItem(CACHE_KEY);
  localStorage.removeItem(CACHE_VERSION_KEY);
}

// Check if cache is valid
export function isCacheValid(version: string): boolean {
  const cachedVersion = localStorage.getItem(CACHE_VERSION_KEY);
  return cachedVersion === version;
}
