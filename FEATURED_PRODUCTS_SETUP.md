# Featured Products Setup Guide

## Issue Fixed ✅
The featured products query was failing due to a **Firestore composite index requirement** when using multiple `where` clauses with `orderBy`.

### What Changed:
- Simplified the query to use only one `where` clause (`isFeatured == true`)
- Moved the `inStock` filtering to application memory instead of database query
- Added error handling to return empty array instead of throwing errors

## How to Enable Featured Products

### Step 1: Mark Products as Featured
1. Go to your admin dashboard: `http://localhost:5173/#/admin/dashboard`
2. Click on the **Products** tab
3. Edit any product you want to feature
4. Toggle the **Featured** switch to ON
5. Make sure the product is also marked as **In Stock**
6. Click **Update Product**

### Step 2: Verify Featured Products
1. Go to the home page: `http://localhost:5173/#/`
2. Scroll down to the **Featured Products** section
3. You should now see all products marked as featured

## Troubleshooting

### No Featured Products Showing?
- **Check Console**: Open browser DevTools (F12) and check for any errors
- **Verify Database**: Make sure at least one product has `isFeatured: true` in Firestore
- **Check Stock**: Featured products must also have `inStock: true` to appear
- **Clear Cache**: Try a hard refresh (Ctrl+Shift+R or Cmd+Shift+R)

### Firestore Console Check:
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to **Firestore Database**
4. Open the `products` collection
5. Check if products have the `isFeatured` field set to `true`

## Optional: Create Composite Index (Advanced)

If you want to restore the original query with both `where` clauses in the database, you need to create a composite index:

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to **Firestore Database** → **Indexes**
4. Click **Add Index**
5. Set up the index:
   - **Collection**: `products`
   - **Fields**:
     - `isFeatured` - Ascending
     - `inStock` - Ascending
     - `createdAt` - Descending
6. Click **Create**
7. Wait for the index to build (usually takes a few minutes)

After the index is created, you can revert to the original query in `services/db.ts`.

## Testing Featured Products

```bash
# Start the development server
npm run dev

# Navigate to http://localhost:5173/#/
# Scroll to "Featured Products" section
# You should see up to 8 featured products
```
