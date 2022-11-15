const domain = window.location.origin;

export default [
  {
    name: "uuidjs",
    url: "https://cdn.jsdelivr.net/npm/uuidjs@4.2.12/src/uuid.min.js",
    description:
      "UUID.js is a JavaScript/ECMAScript library to generate RFC 4122 compliant Universally Unique IDentifiers (UUIDs). This library supports both version 4 UUIDs (UUIDs from random numbers) and version 1 UUIDs (time-based UUIDs), and provides an object-oriented interface to print a generated or parsed UUID in a variety of forms.",
    author: "LiosK",
    version: "4.2.12",
    icon: "https://github.com/LiosK.png?s=20",
  },
  {
    name: "jsonwebtoken",
    description: "JSON Web Token implementation (symmetric and asymmetric)",
    author: "auth0",
    version: "8.5.1",
    url: `${domain}/libraries/jsonwebtoken@8.5.1.js`,
    icon: "https://github.com/auth0.png?s=20",
  },
  {
    name: "@supabase/supabase-js",
    description: "Isomorphic Javascript client for Supabase",
    author: "supabase",
    version: "2.1.0",
    url:
      "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.1.0/dist/umd/supabase.min.js",
    icon: "https://github.com/supabase.png?s=20",
  },
  {
    name: "Mixpanel",
    description: "Isomorphic Javascript client for Supabase",
    author: "supabase",
    version: "2.1.0",
    url: `${domain}/libraries/mixpanel@0.17.0.js`,
    icon: "https://github.com/mixpanel.png?s=20",
  },
  {
    name: "fast-csv",
    description: "CSV parser and writer",
    author: "C2FO",
    version: "4.3.6",
    url: `${domain}/libraries/fast-csv@4.3.6.js`,
    icon: "https://github.com/C2FO.png?s=20",
  },
  {
    name: "ky",
    description: "Tiny and elegant HTTP client based on the browser Fetch API",
    author: "sindresorhus",
    version: "0.25.0",
    url: "https://www.unpkg.com/ky@0.25.0/umd.js",
    icon: "https://github.com/sindresorhus.png?s=20",
  },
  {
    name: "jspdf",
    description: "PDF Document creation from JavaScript",
    author: "MrRio",
    version: "2.5.1",
    url: "https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.js",
    icon: "https://github.com/MrRio.png?s=20",
  },
  {
    name: "@amplitude/analytics-browser",
    description: "Official Amplitude SDK for Web",
    author: "amplitude",
    version: "1.6.1",
    url:
      "https://cdn.jsdelivr.net/npm/@amplitude/analytics-browser@1.6.1/lib/scripts/amplitude-min.umd.js",
    icon: "https://github.com/amplitude.png?s=20",
  },
  {
    name: "uzip-module",
    description: "Module version of UZIP.js",
    author: "greggman",
    version: "1.0.3",
    url: `${domain}/libraries/uzip-module@1.0.3.js`,
    icon: "https://github.com/greggman.png?s=20",
  },
  {
    name: "@sentry/browser",
    description: "Official Sentry SDK for browsers",
    author: "getsentry",
    version: "7.17.3",
    url: "https://browser.sentry-cdn.com/7.17.3/bundle.min.js",
    icon: "https://github.com/getsentry.png?s=20",
  },
];
