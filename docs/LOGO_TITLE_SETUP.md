# Logo & Title Implementation Guide

## Overview
You can now customize your site logo and title from the admin panel. This guide shows how to integrate these settings into your components.

## 1. Update Navbar Component

### Current Implementation
Edit `components/Navbar.tsx`:

```typescript
import { useEffect, useState } from 'react';
import { getWebsiteSettings, WebsiteSettings } from '../services/websiteSettings';
import { useCart } from '../context/CartContext';
import { ShoppingBag, Menu, X } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

export default function Navbar() {
  const [settings, setSettings] = useState<WebsiteSettings | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const { cart } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const data = await getWebsiteSettings();
      setSettings(data);
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  };

  if (!settings) return null; // Or return a skeleton loader

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo & Title */}
          <Link to="/" className="flex items-center gap-3 group">
            {settings.siteLogo && (
              <div className="h-10 w-10 overflow-hidden rounded">
                <img 
                  src={settings.siteLogo} 
                  alt={settings.siteTitle}
                  className="h-full w-full object-cover group-hover:scale-110 transition-transform"
                />
              </div>
            )}
            <span className="hidden sm:inline font-serif font-bold text-lg tracking-wide uppercase">
              {settings.siteTitle}
            </span>
            <span className="sm:hidden font-serif font-bold text-sm tracking-wide uppercase">
              {settings.siteTitle.split(' ')[0]}
            </span>
          </Link>

          {/* Rest of navbar... */}
        </div>
      </div>
    </nav>
  );
}
```

### What This Does
- ✅ Fetches settings on component mount
- ✅ Displays logo with hover effect
- ✅ Shows full title on desktop, shortened on mobile
- ✅ Links logo to home page
- ✅ Gracefully handles missing settings

---

## 2. Update Page Title (Metadata)

### For SEO in App.tsx

```typescript
import { useEffect, useState } from 'react';
import { getWebsiteSettings, WebsiteSettings } from './services/websiteSettings';
import Router from './Router'; // Your routing component

export default function App() {
  const [settings, setSettings] = useState<WebsiteSettings | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const data = await getWebsiteSettings();
      setSettings(data);
      
      // Update document title
      document.title = data.siteTitle;
      
      // Update meta description
      const metaDescription = document.querySelector('meta[name="description"]');
      if (metaDescription) {
        metaDescription.setAttribute('content', data.siteDescription);
      }
      
      // Update meta keywords
      const metaKeywords = document.querySelector('meta[name="keywords"]');
      if (metaKeywords) {
        metaKeywords.setAttribute('content', data.siteKeywords);
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  };

  return <Router />;
}
```

### What This Does
- ✅ Updates browser tab title
- ✅ Updates meta description for SEO
- ✅ Updates meta keywords for SEO
- ✅ Changes reflect in search results

---

## 3. Update Hero Section (Home.tsx)

```typescript
import { useEffect, useState } from 'react';
import { getWebsiteSettings, WebsiteSettings } from '../services/websiteSettings';

export default function Home() {
  const [settings, setSettings] = useState<WebsiteSettings | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const data = await getWebsiteSettings();
    setSettings(data);
  };

  if (!settings) {
    return <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
    </div>;
  }

  return (
    <div>
      {/* Hero Section */}
      <section 
        className="relative h-96 sm:h-screen bg-cover bg-center"
        style={{ backgroundImage: `url(${settings.heroImage})` }}
      >
        <div className="absolute inset-0 bg-black/30"></div>
        <div className="relative h-full flex flex-col justify-center items-center text-center text-white px-4">
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-serif font-bold mb-4 leading-tight">
            {settings.heroTitle}
          </h1>
          <p className="text-lg sm:text-xl mb-8">{settings.heroSubtitle}</p>
          <p className="text-sm sm:text-base mb-8 max-w-2xl">{settings.heroDescription}</p>
          <button className="bg-white text-black px-8 py-3 font-semibold hover:bg-gray-200 transition">
            {settings.heroButtonText}
          </button>
        </div>
      </section>

      {/* Featured Products Section */}
      <section className="py-12 sm:py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-serif font-bold text-center mb-2">
            {settings.featuredTitle}
          </h2>
          <p className="text-gray-600 text-center mb-12">
            {settings.featuredSubtitle}
          </p>
          {/* Featured products list */}
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-12 sm:py-16 px-4 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-serif font-bold text-center mb-2">
            {settings.categoriesTitle}
          </h2>
          <p className="text-gray-600 text-center mb-12">
            {settings.categoriesSubtitle}
          </p>
          {/* Categories list */}
        </div>
      </section>
    </div>
  );
}
```

---

## 4. Update Contact Component

```typescript
import { useEffect, useState } from 'react';
import { getWebsiteSettings, WebsiteSettings } from '../services/websiteSettings';
import { Mail, Phone, MapPin } from 'lucide-react';

export default function Contact() {
  const [settings, setSettings] = useState<WebsiteSettings | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const data = await getWebsiteSettings();
    setSettings(data);
  };

  if (!settings) {
    return <div className="p-8 text-center">Loading...</div>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      {/* Contact Info */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Contact Us</h3>
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <Mail size={20} className="text-purple-600 mt-1" />
            <div>
              <p className="text-sm text-gray-600">{settings.contactEmail1}</p>
              <p className="text-sm text-gray-600">{settings.contactEmail2}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Phone size={20} className="text-purple-600 mt-1" />
            <p className="text-sm">{settings.contactPhoneDisplay}</p>
          </div>
          <div className="flex items-start gap-3">
            <MapPin size={20} className="text-purple-600 mt-1" />
            <div className="text-sm">
              <p>{settings.contactAddress}</p>
              <p>{settings.contactCity}</p>
              <p>{settings.contactState} {settings.contactZip}</p>
              <p>{settings.contactCountry}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Business Hours */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Business Hours</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span>Monday - Friday</span>
            <span className="font-semibold">{settings.mondayFriday}</span>
          </div>
          <div className="flex justify-between">
            <span>Saturday</span>
            <span className="font-semibold">{settings.saturday}</span>
          </div>
          <div className="flex justify-between">
            <span>Sunday</span>
            <span className="font-semibold">{settings.sunday}</span>
          </div>
          <div className="flex justify-between">
            <span>Holidays</span>
            <span className="font-semibold">{settings.holidays}</span>
          </div>
        </div>
      </div>

      {/* Brand Info */}
      <div>
        <h3 className="text-lg font-semibold mb-4">About Us</h3>
        <blockquote className="text-sm italic text-gray-600 mb-4">
          "{settings.brandQuote}"
        </blockquote>
        <p className="text-sm font-semibold">{settings.brandTagline}</p>
      </div>
    </div>
  );
}
```

---

## 5. Admin Panel Updates

The Settings tab is already updated! Just:

1. Go to **Admin Dashboard**
2. Click **Settings** tab
3. Upload your logo in "Site Logo" section
4. Edit "Site Title" field
5. Click **Save Settings**

---

## File Locations

```
Updated Files:
- services/websiteSettings.ts (interface updated)
- pages/admin/AdminDashboard.tsx (UI added)
- firestore.rules (rules updated)

Files to Update (Optional):
- components/Navbar.tsx (display logo)
- App.tsx (meta tags)
- pages/Home.tsx (hero section)
- pages/Contact.tsx (contact info)
```

---

## Testing Checklist

- [ ] Logo uploads successfully
- [ ] Logo displays in admin panel preview
- [ ] Title saves and shows in admin
- [ ] Changes persist after refresh
- [ ] Logo appears in Navbar
- [ ] Browser tab shows new title
- [ ] SEO meta tags updated
- [ ] Mobile responsive (logo scales down)
- [ ] Fallback if settings fail to load

---

## Caching

The settings system automatically caches in localStorage:

```javascript
// To clear cache (for debugging):
localStorage.removeItem('wisania_website_settings');
localStorage.removeItem('wisania_settings_version');

// To view cached settings:
console.log(JSON.parse(localStorage.getItem('wisania_website_settings')));
```

---

## Troubleshooting

### Logo not showing?
1. Check if image URL is valid
2. Verify Firebase Storage permissions
3. Check browser console for errors

### Title not updating?
1. Clear browser cache
2. Check if settings saved (look for success message)
3. Verify Firestore has the data

### Cache issues?
1. Hard refresh page (Ctrl+Shift+R or Cmd+Shift+R)
2. Clear localStorage if needed
3. Check network tab for failed requests

---

## Performance Tips

- ✅ Settings are cached in localStorage (fast!)
- ✅ Only fetched once per page load
- ✅ Automatic cache invalidation on update
- ✅ No unnecessary re-renders
- ✅ Fallback to defaults if offline

---

## Next Steps

1. ✅ Update Navbar to display logo
2. ✅ Update App.tsx for SEO meta tags
3. ✅ Update Home.tsx for hero section
4. ✅ Update Contact.tsx for contact info
5. ✅ Test everything works
6. ✅ Deploy to production

**Happy Customizing!** 🎉
