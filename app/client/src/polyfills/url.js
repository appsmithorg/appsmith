// Simple polyfill for fileURLToPath
export function fileURLToPath(url) {
  if (typeof url === 'string') {
    url = new URL(url);
  }
  if (url.protocol !== 'file:') {
    throw new TypeError('The URL must be of scheme file');
  }
  return decodeURIComponent(url.pathname);
}

// Re-export other url functions
export * from 'url';
