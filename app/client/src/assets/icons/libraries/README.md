# Library Icons

This directory contains icons for JavaScript libraries used in Appsmith. These icons are used in the JS Libraries section of the Explorer panel.

## Icon Sources
The icons are sourced from GitHub user avatars and other official sources. They are downloaded and stored locally to ensure:
- Consistent availability
- Faster loading times
- Reduced dependency on external services
- Better control over asset quality

## Updating Icons
To update or add new library icons:

1. Add the library details to `recommendedLibraries.ts`
2. Add the icon mapping to the `icons` array in `download-icons.js`
3. Run the download script:
   ```bash
   cd app/client/src/assets/icons/libraries
   node download-icons.js
   ```

## Icon Format
- Icons are downloaded in PNG format
- Default size is 64x64 pixels
- File naming convention: `{author-name}.png` (lowercase, hyphenated)

## Adding New Libraries
When adding a new library to Appsmith:
1. Add the library configuration to `recommendedLibraries.ts`
2. Add the icon mapping to `download-icons.js`
3. Run the download script to fetch the new icon
4. Update the library's icon path to point to `/assets/icons/libraries/{filename}.png` 