# MyProfile Component Documentation

## Overview
The `MyProfile.jsx` component allows users to edit their own profile information including:
- **Profile Picture**: Upload and preview profile images
- **Name**: Edit display name
- **Location/Address**: Edit location information
- **Bio/About**: Edit personal bio/about information

Changes made in `MyProfile.jsx` automatically reflect in `UserProfile.jsx` when other users view the profile.

## Files Created/Modified

### New Files:
1. **`src/assets/MyProfile.jsx`** - Main profile editing component
2. **`src/assets/myprofile.css`** - Styling for MyProfile component

### Modified Files:
1. **`src/assets/UserProfile.jsx`** - Updated to display uploaded profile pictures
2. **`src/assets/userprofile.css`** - Added styles for avatar images
3. **`src/App.jsx`** - Added MyProfile routing and navigation
4. **`src/assets/Dashboard.jsx`** - Added Profile tab click handler

## Features

### 1. Edit Mode Toggle
- Click "✎ Edit Profile" button to enter edit mode
- Click "✕ Cancel" to exit without saving changes
- All changes are preserved until save or cancel

### 2. Profile Picture Upload
- Click on the avatar to select an image
- Real-time preview of selected image
- Validates file size (max 5MB)
- Validates file type (images only)
- Supports all common image formats

### 3. Editable Fields
- **Name**: Text input for display name
- **Location**: Text input for address/location
- **Bio**: Textarea for about/bio information (expandable)

### 4. Save Changes
- Click "💾 Save Changes" to update profile
- Shows loading state while saving
- Displays success message on completion
- Updates localStorage and UI immediately

### 5. Real-time Updates
- Changes reflect immediately in MyProfile
- Changes visible in UserProfile when others view the profile
- Profile picture updates persist across sessions

## Navigation

Users can access MyProfile by:
1. Clicking the **Profile** tab (👤) in the bottom navigation bar
2. The component shows the current user's profile based on `localStorage`

## Backend API Requirements

The component expects the following API endpoints:

### 1. Get User Profile
```
GET /api/users/:userId
Authorization: Bearer {token}
```

**Response:**
```json
{
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "location": "New York, USA",
    "bio": "Software developer and tech enthusiast",
    "avatar_url": "https://example.com/avatars/user1.jpg",
    "rating": 4.5,
    "total_products": 10,
    "total_sales": 25,
    "created_at": "2024-01-15"
  }
}
```

### 2. Update User Profile
```
PUT /api/users/:userId
Authorization: Bearer {token}
Content-Type: multipart/form-data
```

**Request Body (FormData):**
- `name`: string (required)
- `location`: string (required)
- `bio`: string (required)
- `avatar`: file (optional) - Image file for profile picture

**Response:**
```json
{
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "location": "New York, USA",
    "bio": "Updated bio text",
    "avatar_url": "https://example.com/avatars/user1_updated.jpg",
    "rating": 4.5,
    "total_products": 10,
    "total_sales": 25,
    "created_at": "2024-01-15"
  }
}
```

## Usage Example

### In App.jsx (Already integrated):
```jsx
import MyProfile from './assets/MyProfile.jsx'

function App() {
  // ... existing code ...
  
  function handleNavigateToMyProfile() {
    setCurrentPage('myprofile')
  }
  
  return (
    <div className="App">
      {currentPage === 'myprofile' ? (
        <MyProfile onNavigateBack={handleNavigateBack} />
      ) : (
        // ... other pages
      )}
    </div>
  )
}
```

### In Dashboard.jsx (Already integrated):
```jsx
<Dashboard
  user={user}
  onLogout={handleLogout}
  onNavigateToMarket={handleNavigateToMarket}
  onNavigateToNotifications={handleNavigateToNotifications}
  onNavigateToUserList={handleNavigateToUserList}
  onNavigateToMyProfile={handleNavigateToMyProfile}
/>
```

## Styling

The component uses the same color scheme and layout as `UserProfile.jsx`:
- **Primary Color**: `#a9492e` (rust red)
- **Background**: `#f6e9d6` (beige)
- **Card Background**: `#fff` (white)
- **Accent**: `#ffd9b3` (light peach)

All styles are mobile-responsive with breakpoints at 768px.

## Error Handling

The component handles various error scenarios:
1. **No user logged in**: Shows error message and back button
2. **Failed to load profile**: Displays error with retry option
3. **Image too large**: Alert for files > 5MB
4. **Invalid file type**: Alert for non-image files
5. **Failed to save**: Error message with details

## Testing Checklist

- [ ] Profile loads with current user data
- [ ] Edit mode toggles correctly
- [ ] Profile picture upload works
- [ ] Profile picture preview displays
- [ ] Name field updates
- [ ] Location field updates
- [ ] Bio field updates
- [ ] Save changes works
- [ ] Success message displays
- [ ] Changes reflect in UserProfile
- [ ] Cancel button resets form
- [ ] Error messages display correctly
- [ ] Mobile responsive layout works
- [ ] Navigation back works

## Future Enhancements

Potential improvements:
1. Add image cropping/resizing before upload
2. Add password change functionality
3. Add email change with verification
4. Add privacy settings
5. Add profile deletion option
6. Add profile completion percentage
7. Add social media links
8. Add cover photo upload
9. Add activity history
10. Add profile verification badges

## Support

For issues or questions, check:
- Component file: `src/assets/MyProfile.jsx`
- Styling file: `src/assets/myprofile.css`
- API integration: `src/lib/api.js`
