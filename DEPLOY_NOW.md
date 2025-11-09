# Deployment Instructions - UI Redesign Update

**Date:** 2025-11-08
**Changes:** Complete UI redesign with professional, trustworthy appearance + Tailwind CSS v4 configuration fix

## What Changed

1. **Design System Overhaul:**
   - Professional blue color palette
   - Semantic color scales (success, warning, danger, accent)
   - Custom shadow system (soft, medium, strong)
   - Inter font family integration
   - Improved typography hierarchy

2. **Tailwind CSS v4 Migration:**
   - Removed incompatible `tailwind.config.js`
   - Migrated to CSS-based configuration using `@theme` directive in `globals.css`
   - All custom colors and design tokens now in CSS variables

3. **Dashboard Redesign:**
   - Welcoming header section
   - Redesigned stat cards with hover effects and animations
   - Improved empty states with icons
   - Enhanced behavior list with better visual hierarchy
   - Redesigned quick action cards with gradients
   - Better spacing and rounded corners throughout

## Deployment Steps

Execute these commands in the application directory (`/var/www/autism`):

```bash
# 1. Navigate to application directory
cd /var/www/autism

# 2. Pull latest changes from Git
git pull origin main

# 3. Install dependencies (ensure all packages are current)
npm install

# 4. Clean previous build
rm -rf .next

# 5. Build application with new design
npm run build

# 6. Restart PM2 process
pm2 restart autism-tracker

# 7. Verify deployment
pm2 status
pm2 logs autism-tracker --lines 50

# 8. Test the application
curl -I https://autism.haielab.org
```

## Verification

After deployment, verify:
- [ ] Application is running (pm2 status shows "online")
- [ ] No errors in PM2 logs
- [ ] HTTPS site loads at https://autism.haielab.org
- [ ] New professional design is visible
- [ ] All colors, shadows, and typography are correct

## Troubleshooting

If issues occur:

1. **Build fails:**
   ```bash
   npm install --force
   npm run build
   ```

2. **PM2 won't restart:**
   ```bash
   pm2 delete autism-tracker
   pm2 start npm --name "autism-tracker" -- start
   pm2 save
   ```

3. **Old design still showing:**
   - Clear browser cache (hard refresh: Ctrl+Shift+R)
   - Check nginx cache: `sudo systemctl restart nginx`

## Expected Outcome

Users should see:
- ✅ Light slate background (not pure white)
- ✅ White cards with subtle shadows
- ✅ Professional blue color scheme
- ✅ Inter font throughout
- ✅ Rounded corners (rounded-xl)
- ✅ Smooth hover effects
- ✅ Color-coded severity badges (green/yellow/red)

## Commits Included

- `0ed7afd` - design: Redesign interface with professional, trustworthy UI
- `4236d26` - fix: Update Tailwind CSS configuration for v4

---

**Note:** This is a visual redesign only. No functionality changes. All data remains in client-side IndexedDB.
