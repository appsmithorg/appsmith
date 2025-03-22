const fs = require('fs');
const https = require('https');
const path = require('path');

// List of GitHub usernames and their corresponding icon filenames
const icons = [
  { username: 'auth0', filename: 'auth0.png' },
  { username: 'NaturalIntelligence', filename: 'natural-intelligence.png' },
  { username: 'MrRio', filename: 'mrrio.png' },
  { username: 'amplitude', filename: 'amplitude.png' },
  { username: 'supabase', filename: 'supabase.png' },
  { username: 'LiosK', filename: 'liosk.png' },
  { username: 'dcodeIO', filename: 'dcodeio.png' },
  { username: 'mholt', filename: 'mholt.png' },
  { username: 'sindresorhus', filename: 'sindresorhus.png' },
  { username: 'appwrite', filename: 'appwrite.png' },
  { username: 'i18next', filename: 'i18next.png' },
  { username: 'greggman', filename: 'greggman.png' },
  { username: 'getsentry', filename: 'getsentry.png' },
  { username: 'dchester', filename: 'dchester.png' },
  { username: 'segmentio', filename: 'segmentio.png' },
];

// Function to download an icon
function downloadIcon(username, filename) {
  const url = `https://github.com/${username}.png?s=64`; // Using 64x64 for better quality
  const filepath = path.join(__dirname, filename);
  
  return new Promise((resolve, reject) => {
    const options = {
      headers: {
        'User-Agent': 'Appsmith'
      },
      followRedirect: true
    };

    https.get(url, options, (response) => {
      // Handle redirects
      if (response.statusCode === 302 || response.statusCode === 301) {
        const redirectUrl = response.headers.location;
        https.get(redirectUrl, options, (redirectResponse) => {
          if (redirectResponse.statusCode === 200) {
            const file = fs.createWriteStream(filepath);
            redirectResponse.pipe(file);
            file.on('finish', () => {
              file.close();
              console.log(`Downloaded ${filename}`);
              resolve();
            });
          } else {
            reject(new Error(`Failed to download ${username} after redirect: ${redirectResponse.statusCode}`));
          }
        }).on('error', (err) => {
          reject(err);
        });
      } else if (response.statusCode === 200) {
        const file = fs.createWriteStream(filepath);
        response.pipe(file);
        file.on('finish', () => {
          file.close();
          console.log(`Downloaded ${filename}`);
          resolve();
        });
      } else {
        reject(new Error(`Failed to download ${username}: ${response.statusCode}`));
      }
    }).on('error', (err) => {
      reject(err);
    });
  });
}

// Download all icons
async function downloadAllIcons() {
  try {
    await Promise.all(icons.map(icon => downloadIcon(icon.username, icon.filename)));
    console.log('All icons downloaded successfully!');
  } catch (error) {
    console.error('Error downloading icons:', error);
  }
}

// Run the download
downloadAllIcons(); 