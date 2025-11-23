# Firebase Security Rules Documentation

## Overview
This document explains the Firestore security rules for the Wisania e-commerce application. Security rules protect your data while allowing appropriate access to different user types.

## Architecture

### User Types
1. **Unauthenticated Users** - Regular website visitors
2. **Authenticated Users** - Users with Firebase Auth accounts
3. **Admin Users** - Users with `admin` custom claim set to `true`

### Authentication Flow
```
Request → Firebase Auth Check → Custom Claims Verification → Rule Execution
```

## Rules Breakdown

### 1. Helper Functions

```firestore
function isAdmin() {
  return request.auth != null && 
         request.auth.token.admin == true;
}

function isAuthenticated() {
  return request.auth != null;
}
```

**isAdmin()**: Checks if user is authenticated AND has `admin` claim  
**isAuthenticated()**: Checks if user has a valid auth token

---

### 2. Categories Collection (`/categories/{categoryId}`)

```firestore
match /categories/{categoryId} {
  // Anyone can read categories
  allow read: if true;
  
  // Only admins can create, update, or delete categories
  allow create, update, delete: if isAdmin();
}
```

**Read**: ✅ Public (everyone can browse categories)  
**Create/Update/Delete**: 🔒 Admin only

**Use Cases**:
- Website visitors can view categories
- Admin can manage category list

---

### 3. Products Collection (`/products/{productId}`)

```firestore
match /products/{productId} {
  // Anyone can read products
  allow read: if true;
  
  // Only admins can create, update, or delete products
  allow create, update, delete: if isAdmin();
}
```

**Read**: ✅ Public (everyone can view products)  
**Create/Update/Delete**: 🔒 Admin only

**Use Cases**:
- Website visitors can browse products
- Admin can manage product inventory

---

### 4. Orders Collection (`/orders/{orderId}`)

```firestore
match /orders/{orderId} {
  // Only admins can read all orders
  allow read: if isAdmin();
  
  // Anyone can create an order (for checkout)
  allow create: if true;
  
  // Only admins can update order status
  allow update: if isAdmin();
  
  // No one can delete orders (for record keeping)
  allow delete: if false;
}
```

**Read**: 🔒 Admin only  
**Create**: ✅ Public (customers can place orders)  
**Update**: 🔒 Admin only  
**Delete**: ❌ Disabled (maintain audit trail)

**Use Cases**:
- Customers place orders without auth
- Admin views all orders
- Admin updates order status (pending → shipped → delivered)
- Orders are permanent (never deleted)

---

### 5. Admins Collection (`/admins/{userId}`)

```firestore
match /admins/{userId} {
  // Only the admin themselves can read their own data
  allow read: if isAuthenticated() && request.auth.uid == userId;
  
  // Only existing admins can create new admins
  allow create, update, delete: if isAdmin();
}
```

**Read**: 🔒 Self-only  
**Create/Update/Delete**: 🔒 Admin only

**Use Cases**:
- Admins can view their own profile
- Only existing admins can promote new admins
- Prevents privilege escalation

---

### 6. Contacts Collection (`/contacts/{contactId}`)

```firestore
match /contacts/{contactId} {
  // Anyone can create a contact message (submit form)
  allow create: if true;
  
  // Only admins can read and update contact messages
  allow read, update: if isAdmin();
  
  // Only admins can delete (archive) contact messages
  allow delete: if isAdmin();
}
```

**Create**: ✅ Public (any visitor can contact)  
**Read**: 🔒 Admin only  
**Update**: 🔒 Admin only  
**Delete**: 🔒 Admin only

**Use Cases**:
- Website visitors submit contact forms
- Admin views all contact submissions
- Admin can mark messages as read/resolved
- Admin can archive messages

---

### 7. Settings Collection (`/settings/{document}`)

```firestore
match /settings/{document=**} {
  // Anyone can read website settings (needed for website to display content)
  allow read: if true;
  
  // Only admins can create, update, or delete settings
  allow create, update, delete: if isAdmin();
}
```

**Read**: ✅ Public (website needs to fetch settings)  
**Create/Update/Delete**: 🔒 Admin only

**Use Cases**:
- Website fetches settings for dynamic content
- Admin customizes website content
- Logo, titles, contact info, etc. are public but editable only by admins

---

### 8. Default Rule (Deny All)

```firestore
match /{document=**} {
  allow read, write: if false;
}
```

**Impact**: ❌ All other collections are completely blocked  
**Purpose**: Whitelisting approach - only explicitly allowed access is granted

---

## Security Principles

### 1. Least Privilege
- Users have minimum required access
- Admin access is explicitly checked
- Public content is marked with `allow read: if true`

### 2. Deny by Default
- Default rule denies all access
- Only whitelisted collections are accessible
- Reduces attack surface

### 3. Custom Claims for Admin
- Admin status is enforced via Firebase Custom Claims
- Cannot be bypassed from client side
- Must be set via Firebase Admin SDK or Console

### 4. Immutable Audit Trail
- Orders can be created and updated but not deleted
- Maintains complete history for compliance

### 5. Role-Based Access Control (RBAC)
- Different rules for different user roles
- Prevents unauthorized access to sensitive data

---

## Setting Up Admin Users

### Method 1: Firebase Console

1. Go to **Authentication** → **Users**
2. Find the user to promote
3. Click on **UID**
4. Go to **Custom Claims** (at the bottom)
5. Add:
```json
{
  "admin": true
}
```

### Method 2: Firebase Admin SDK

```javascript
// In your backend (Node.js, Cloud Functions, etc.)
const admin = require('firebase-admin');

// Set custom claims on user
admin.auth().setCustomUserClaims(uid, { admin: true })
  .then(() => {
    console.log('Admin claim set for user:', uid);
  })
  .catch(error => {
    console.log('Error setting custom claims:', error);
  });
```

### Method 3: Cloud Function (Automatic on User Creation)

```javascript
// Create a Cloud Function that automatically makes the first user admin
exports.makeFirstUserAdmin = functions.auth.user().onCreate((user) => {
  const admin = require('firebase-admin');
  
  // Check if this is the first user
  admin.auth().listUsers(1)
    .then((userList) => {
      if (userList.users.length === 1) {
        // First user - make them admin
        admin.auth().setCustomUserClaims(user.uid, { admin: true });
      }
    });
});
```

---

## Testing Rules

### View Rule Evaluation in Console

1. Go to **Firestore** → **Rules**
2. Click **Rules Playground** (at top)
3. Set:
   - **Collection**: `products`
   - **Document**: `test-product`
   - **Operation**: `get`
   - **Auth**: Select user or provide custom token

### Testing Scenarios

| Scenario | User | Operation | Collection | Expected | Status |
|----------|------|-----------|-----------|----------|--------|
| Browse products | Anonymous | Read | products | ✅ Allow | Public |
| Create product | Customer | Create | products | ❌ Deny | Not Admin |
| Create product | Admin | Create | products | ✅ Allow | Admin |
| Place order | Anonymous | Create | orders | ✅ Allow | Public |
| View all orders | Customer | Read | orders | ❌ Deny | Not Admin |
| View all orders | Admin | Read | orders | ✅ Allow | Admin |
| Submit contact | Anonymous | Create | contacts | ✅ Allow | Public |
| View contacts | Customer | Read | contacts | ❌ Deny | Not Admin |
| Delete contact | Admin | Delete | contacts | ✅ Allow | Admin |
| Delete order | Admin | Delete | orders | ❌ Deny | Immutable |

---

## Common Issues & Solutions

### Issue 1: Admin Operations Not Working
**Symptom**: Admin is denied access despite being admin  
**Cause**: Custom claims not set or token not refreshed  
**Solution**:
```javascript
// Force token refresh after setting claims
await auth.currentUser.getIdToken(true);
```

### Issue 2: Website Can't Fetch Settings
**Symptom**: Settings not loading on website  
**Cause**: Settings collection rules too restrictive  
**Solution**: Ensure `allow read: if true` for settings collection

### Issue 3: Customers Can Modify Orders
**Symptom**: Non-admin can update orders  
**Cause**: Rules too permissive  
**Solution**: Verify `allow update: if isAdmin()` is in place

### Issue 4: Cascade Delete Not Working
**Symptom**: Deleting collection doesn't delete related documents  
**Cause**: Firestore rules don't cascade deletes  
**Solution**: Use Cloud Functions to handle cascading deletes

---

## Best Practices

### 1. Regular Audits
- Review rules monthly
- Check for overly permissive rules
- Monitor security events in Cloud Logging

### 2. Staged Rollout
- Test rules in development first
- Use staging environment
- Deploy to production after validation

### 3. Monitor Activity
```javascript
// Log all admin operations
functions.firestore
  .document('products/{productId}')
  .onUpdate((change, context) => {
    console.log('Product updated by admin');
  });
```

### 4. Backup Strategy
- Enable automated backups
- Test restore process
- Document recovery procedures

### 5. Documentation
- Keep rules documented (like this file)
- Document any custom claims
- Maintain admin user list

---

## Performance Considerations

### Query Optimization
```javascript
// Good - Filtered by admin first
db.collection('orders')
  .where('adminViewed', '==', true)
  .get();

// Bad - Fetches all then filters (violates rules)
db.collection('orders').get()
  .then(snapshot => snapshot.docs.filter(...));
```

### Index Strategy
Create indexes for common queries:
- `orders.status`
- `orders.createdAt`
- `contacts.read`

---

## Migration Guide

### From Old Rules
If upgrading from different rules:

1. **Backup existing data**
   ```bash
   gcloud firestore export gs://your-bucket/backup
   ```

2. **Update rules gradually**
   - Test on staging first
   - Deploy with monitoring
   - Have rollback plan

3. **Verify all operations work**
   - Test admin creation
   - Test product management
   - Test order placement
   - Test contact submission

---

## Compliance

### GDPR Compliance
- ✅ Data deletion by admins only
- ✅ No automatic data sharing
- ✅ Audit trail maintained
- ✅ Encryption in transit (Firebase enforces)

### Data Security
- ✅ Role-based access control
- ✅ No cross-user data access
- ✅ Immutable order records
- ✅ Admin operations logged

---

## Support

For issues with Firebase Rules:

1. Check [Firebase Documentation](https://firebase.google.com/docs/firestore/security/start)
2. Review [Rules Playground](https://console.firebase.google.com)
3. Check Cloud Logging for errors
4. Contact Firebase Support for complex issues

---

## Rule Version History

| Version | Date | Changes |
|---------|------|---------|
| 2.0 | 2025-11-24 | Added settings collection rules |
| 1.0 | 2025-01-01 | Initial rules setup |

---

## Quick Reference

```firestore
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    
    function isAdmin() {
      return request.auth != null && 
             request.auth.token.admin == true;
    }
    
    function isAuthenticated() {
      return request.auth != null;
    }
    
    // Public Read, Admin Write
    match /categories/{categoryId} {
      allow read: if true;
      allow create, update, delete: if isAdmin();
    }
    
    match /products/{productId} {
      allow read: if true;
      allow create, update, delete: if isAdmin();
    }
    
    // Public Create (Orders), Admin Read/Update
    match /orders/{orderId} {
      allow read: if isAdmin();
      allow create: if true;
      allow update: if isAdmin();
      allow delete: if false;
    }
    
    // Self-Read, Admin Manage
    match /admins/{userId} {
      allow read: if isAuthenticated() && request.auth.uid == userId;
      allow create, update, delete: if isAdmin();
    }
    
    // Public Create (Contacts), Admin Read/Manage
    match /contacts/{contactId} {
      allow create: if true;
      allow read, update, delete: if isAdmin();
    }
    
    // Public Read (Settings), Admin Write
    match /settings/{document=**} {
      allow read: if true;
      allow create, update, delete: if isAdmin();
    }
    
    // Default Deny
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

---

**Last Updated**: November 24, 2025  
**Status**: Production Ready
