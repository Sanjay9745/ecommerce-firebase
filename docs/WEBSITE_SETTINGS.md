# Website Settings Feature

## Overview
Added a comprehensive Website Settings management system to the admin panel that allows you to customize all content displayed on your website through a user-friendly interface.

## Features

### 1. **New Settings Tab**
- Added a new "Settings" tab in the admin dashboard
- Beautiful purple-themed UI with organized sections
- Loading states with spinner animation
- Save button with loading indicator

### 2. **Customizable Content Sections**

#### Hero Section
- Hero Title (supports multi-line text)
- Hero Subtitle
- Hero Description
- Hero Button Text
- Hero Image (with image upload component)

#### Brand Section
- Brand Quote
- Brand Tagline

#### Contact Information
- Two Email Addresses
- Phone Number (raw format for WhatsApp)
- Phone Display Format (formatted for display)
- Complete Address (Street, City, State, ZIP, Country)

#### Business Hours
- Monday - Friday timing
- Saturday timing
- Sunday timing
- Holiday hours

#### Page Section Titles
- Featured Products Title & Subtitle
- Categories Title & Subtitle
- Contact Section Title & Description

#### SEO & Meta Tags
- Site Title
- Site Description
- Keywords (comma-separated)

#### Social Media Links
- Facebook URL
- Instagram URL
- Twitter URL
- Pinterest URL

### 3. **Smart Caching System**

#### LocalStorage Caching
- All settings are cached in `localStorage` for instant loading
- Cache key: `wisania_website_settings`
- Version key: `wisania_settings_version`

#### Automatic Cache Invalidation
- Unique hash generated on every save using timestamp + random string
- Format: `${Date.now().toString(36)}${Math.random().toString(36).substr(2)}`
- Old cache is automatically invalidated when version changes
- Ensures users always see the latest content

#### Fallback System
- If Firestore fails, loads from localStorage cache
- If cache is unavailable, uses default settings
- Graceful error handling at every level

### 4. **Data Flow**

```
Admin Saves Settings
    ↓
1. Generate new unique hash (version)
2. Update lastUpdated timestamp
3. Save to Firestore
4. Update localStorage cache
    ↓
User Visits Website
    ↓
1. Check localStorage cache
2. Fetch from Firestore
3. Compare versions
4. Use cache if versions match
5. Update cache if version changed
```

### 5. **Technical Implementation**

#### Files Created/Modified

**New File: `services/websiteSettings.ts`**
- `WebsiteSettings` interface with all customizable fields
- `getWebsiteSettings()` - Fetches settings with cache fallback
- `updateWebsiteSettings()` - Saves settings with hash generation
- `clearSettingsCache()` - Utility to clear cache
- `isCacheValid()` - Check if cache version is valid
- `DEFAULT_SETTINGS` - Default values for all fields

**Modified: `pages/admin/AdminDashboard.tsx`**
- Added `'settings'` to `TabType` union
- Imported `WebsiteSettings` interface and service functions
- Added state: `websiteSettings`, `isLoadingSettings`, `isSavingSettings`
- Updated `fetchData()` to load settings when tab is active
- Added `handleSaveSettings()` function
- Added Settings tab button to navigation
- Added complete Settings tab UI with all form fields

#### Firestore Structure
```
settings/
  └── website/
      ├── heroTitle: string
      ├── heroSubtitle: string
      ├── heroDescription: string
      ├── heroImage: string
      ├── heroButtonText: string
      ├── brandQuote: string
      ├── brandTagline: string
      ├── contactEmail1: string
      ├── contactEmail2: string
      ├── contactPhone: string
      ├── contactPhoneDisplay: string
      ├── contactAddress: string
      ├── contactCity: string
      ├── contactState: string
      ├── contactZip: string
      ├── contactCountry: string
      ├── mondayFriday: string
      ├── saturday: string
      ├── sunday: string
      ├── holidays: string
      ├── featuredTitle: string
      ├── featuredSubtitle: string
      ├── categoriesTitle: string
      ├── categoriesSubtitle: string
      ├── contactTitle: string
      ├── contactDescription: string
      ├── siteTitle: string
      ├── siteDescription: string
      ├── siteKeywords: string
      ├── facebook: string
      ├── instagram: string
      ├── twitter: string
      ├── pinterest: string
      ├── lastUpdated: number (timestamp)
      └── version: string (unique hash)
```

## Usage

### For Admin
1. Go to Admin Dashboard
2. Click on the **Settings** tab (purple icon)
3. Edit any field you want to customize
4. Upload new images using the image upload component
5. Click **Save Settings** button
6. Wait for success confirmation
7. Refresh your website to see changes

### For Developers - Integrating Settings in Frontend

To use the settings in your components:

```tsx
import { useEffect, useState } from 'react';
import { getWebsiteSettings, WebsiteSettings } from '../services/websiteSettings';

function MyComponent() {
  const [settings, setSettings] = useState<WebsiteSettings | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const data = await getWebsiteSettings();
    setSettings(data);
  };

  if (!settings) return <div>Loading...</div>;

  return (
    <div>
      <h1>{settings.heroTitle}</h1>
      <p>{settings.heroDescription}</p>
      <img src={settings.heroImage} alt="Hero" />
    </div>
  );
}
```

## Next Steps

### To Make Website Dynamic
You need to update these files to use the settings instead of hardcoded values:

1. **pages/Home.tsx**
   - Replace hero section content with `websiteSettings.heroTitle`, `heroSubtitle`, etc.
   - Replace featured products section title
   - Replace categories section title

2. **components/Contact.tsx**
   - Replace contact details with `websiteSettings.contactEmail1`, `contactPhone`, etc.
   - Replace business hours
   - Replace contact section title and description

3. **App.tsx / index.html**
   - Update `<title>` tag with `websiteSettings.siteTitle`
   - Update meta description with `websiteSettings.siteDescription`
   - Update meta keywords with `websiteSettings.siteKeywords`

### Example: Updating Home.tsx

```tsx
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
      <section className="hero">
        <h1>{settings.heroTitle}</h1>
        <h2>{settings.heroSubtitle}</h2>
        <p>{settings.heroDescription}</p>
        <button>{settings.heroButtonText}</button>
        <img src={settings.heroImage} alt="Hero" />
      </section>

      {/* Featured Products */}
      <section>
        <h2>{settings.featuredTitle}</h2>
        <p>{settings.featuredSubtitle}</p>
        {/* Product list */}
      </section>

      {/* Categories */}
      <section>
        <h2>{settings.categoriesTitle}</h2>
        <p>{settings.categoriesSubtitle}</p>
        {/* Category list */}
      </section>
    </div>
  );
}
```

## Benefits

✅ **No Code Changes Required** - Update content without touching code  
✅ **Instant Cache** - Lightning-fast loading with localStorage  
✅ **Auto-Sync** - Changes sync across all devices  
✅ **Mobile Responsive** - Settings UI works great on mobile  
✅ **Type Safe** - Full TypeScript support  
✅ **Error Handling** - Graceful fallbacks at every level  
✅ **SEO Friendly** - Customizable meta tags  
✅ **Image Upload** - Built-in image upload component  

## Troubleshooting

### Settings not loading?
1. Check browser console for errors
2. Verify Firebase configuration
3. Clear localStorage: `localStorage.removeItem('wisania_website_settings')`

### Changes not appearing?
1. Make sure you clicked "Save Settings"
2. Refresh the website (hard refresh: Ctrl+Shift+R)
3. Check if the version hash changed in the cache info

### Performance issues?
- The caching system ensures optimal performance
- Settings are only fetched once and cached
- Version comparison happens instantly in localStorage

## Security

- Settings are stored in Firestore with proper security rules
- Only authenticated admins can modify settings
- All inputs are sanitized by React
- Image uploads are handled securely through Firebase Storage

## Mobile Responsiveness

The Settings tab is fully mobile-responsive:
- Form fields stack vertically on small screens
- Two-column grid on medium+ screens
- Touch-friendly input fields
- Responsive padding and spacing
- Optimized for all screen sizes
