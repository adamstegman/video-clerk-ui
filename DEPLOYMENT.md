# Video Clerk - iOS Deployment Guide

This guide covers deploying Video Clerk to the App Store via TestFlight.

## Prerequisites

### 1. Apple Developer Account
- [ ] Enroll in Apple Developer Program ($99/year)
- [ ] Create App Store Connect app listing
- [ ] Note your Apple ID, ASC App ID, and Team ID

### 2. EAS Account
- [ ] Sign up at https://expo.dev
- [ ] Install EAS CLI: `npm install -g eas-cli`
- [ ] Login: `eas login`

## Phase 4 Checklist

### Step 1: App Icons & Splash Screen

The app currently uses default Expo icons. You need to create custom ones:

**App Icon** (`assets/icon.png`):
- Size: 1024x1024 px
- Format: PNG with no transparency
- Design: Video Clerk logo/branding
- Tool suggestion: Figma, Canva, or hire a designer

**Splash Screen** (`assets/splash-icon.png`):
- Size: 1284x2778 px (iPhone 14 Pro Max)
- Format: PNG
- Background: White (#ffffff) or brand color
- Icon: Centered logo

**Favicon** (`assets/favicon.png`):
- Size: 48x48 px
- Format: PNG
- Design: Simplified icon

### Step 2: Configure EAS Build

The `eas.json` file has been created with three build profiles:

```bash
# Development build (simulator only)
eas build --profile development --platform ios

# Preview build (TestFlight internal testing)
eas build --profile preview --platform ios

# Production build (App Store submission)
eas build --profile production --platform ios
```

**Update `eas.json` submit section** with your Apple credentials:
```json
{
  "submit": {
    "production": {
      "ios": {
        "appleId": "your-email@example.com",
        "ascAppId": "1234567890",
        "appleTeamId": "ABC123DEF4"
      }
    }
  }
}
```

### Step 3: Environment Variables

Create `.env` file in the project root (if not already present):

```bash
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
EXPO_PUBLIC_TMDB_API_READ_TOKEN=your-tmdb-token
```

For EAS Build, add these as secrets:
```bash
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_URL --value "https://..."
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value "eyJ..."
eas secret:create --scope project --name EXPO_PUBLIC_TMDB_API_READ_TOKEN --value "eyJ..."
```

### Step 4: Build for TestFlight

```bash
# First production build
eas build --platform ios --profile production

# Upload to TestFlight automatically
eas submit --platform ios --profile production
```

Or manually:
1. Download the `.ipa` file from EAS dashboard
2. Upload to App Store Connect via Transporter app
3. Submit for internal testing in TestFlight

### Step 5: App Store Connect Setup

#### App Information
- **Name**: Video Clerk
- **Subtitle**: Decide what to watch together
- **Category**: Entertainment or Lifestyle
- **Privacy Policy URL**: Create and host a privacy policy
- **Support URL**: Create a support page or use GitHub issues

#### Privacy Labels

Based on the Privacy Manifest (`ios/PrivacyInfo.xcprivacy`):

| Data Type | Purpose | Linked to User | Used for Tracking |
|-----------|---------|----------------|-------------------|
| Email Address | App Functionality | Yes | No |
| User ID | App Functionality | Yes | No |
| Product Interaction | App Functionality | Yes | No |

**Data Not Collected:**
- Location, Contacts, Photos, etc.

**Tracking**: No

#### App Screenshots

Required sizes (use simulator or iPhone):
- 6.7" Display (iPhone 14 Pro Max): 1290 x 2796
- 6.5" Display (iPhone 11 Pro Max): 1242 x 2688
- 5.5" Display (iPhone 8 Plus): 1242 x 2208

Take screenshots of:
1. Watch page with card swiping
2. List of saved items
3. Settings/group management
4. Winner selection screen

#### App Preview Video (Optional)
- 15-30 seconds
- Demonstrate core features
- Same sizes as screenshots

### Step 6: TestFlight Beta Testing

1. **Internal Testing** (up to 100 testers, no review):
   - Add testers by email in App Store Connect
   - They receive TestFlight invite
   - Collect feedback

2. **External Testing** (up to 10,000 testers, requires review):
   - Submit for beta review
   - Public link or invite by email
   - Get broader feedback

**Suggested Testing Duration**: 1-2 weeks minimum

### Step 7: App Store Submission

1. **Complete App Information** in App Store Connect
2. **Upload final build** via EAS or Transporter
3. **Add version release notes**
4. **Submit for review**

**Review Process**:
- Typically 24-48 hours
- May request additional info or changes
- Common rejections: privacy policy, missing functionality

### Step 8: Post-Approval

- [ ] Release app to App Store
- [ ] Monitor crash reports in App Store Connect
- [ ] Respond to user reviews
- [ ] Plan v1.1 features (see migration plan)

## Troubleshooting

### Build Fails
- Check Expo SDK compatibility
- Verify all dependencies support iOS
- Review build logs in EAS dashboard

### Rejected by App Review
- Common issues: privacy policy, TMDB attribution, missing features
- Respond to reviewer notes
- Resubmit with fixes

### Universal Links Not Working
- Verify `apple-app-site-association` file is hosted at `https://videoclerk.app/.well-known/apple-app-site-association`
- Check Team ID matches in both app.json and AASA file
- Test with `https://branch.io/resources/aasa-validator/`

## Additional Resources

- [Expo EAS Build Documentation](https://docs.expo.dev/build/introduction/)
- [App Store Connect Help](https://help.apple.com/app-store-connect/)
- [App Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- [TestFlight Beta Testing](https://developer.apple.com/testflight/)

## Support

For issues specific to Video Clerk deployment, create an issue in the GitHub repository.
