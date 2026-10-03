import { ASSETS_CDN_URL } from "constants/ThirdPartyConstants";
import { getAssetUrl } from "ee/utils/airgapHelpers";

/**
 * Helper to build internal CDN icon URLs for JS library author avatars.
 * Icons are hosted at: https://assets.appsmith.com/js-library-icons/<author>.png
 * The getAssetUrl wrapper ensures compatibility with air-gapped deployments.
 */
const jsLibIcon = (author: string) =>
  getAssetUrl(`${ASSETS_CDN_URL}/js-library-icons/${author}.png`);

export default [
  {
    name: "jsonwebtoken",
    description: "JSON Web Token implementation (symmetric and asymmetric)",
    author: "auth0",
    docsURL: "https://github.com/auth0/node-jsonwebtoken#readme",
    version: "8.5.1",
    url: "/libraries/jsonwebtoken@8.5.1.js",
    icon: jsLibIcon("auth0"),
  },
  {
    name: "fast-xml-parser",
    description:
      "Validate XML, Parse XML to JS Object, or Build XML from JS Object without C/C++ based libraries and no callback.",
    author: "NaturalIntelligence",
    docsURL: "https://github.com/NaturalIntelligence/fast-xml-parser",
    url: "https://cdn.jsdelivr.net/npm/fast-xml-parser@4.5.4/src/fxp.min.js",
    version: "4.5.4",
    icon: jsLibIcon("NaturalIntelligence"),
  },
  {
    name: "jspdf",
    description: "PDF Document creation from JavaScript",
    author: "MrRio",
    docsURL: "https://raw.githack.com/MrRio/jsPDF/master/docs/index.html",
    version: "2.5.1",
    url: "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js",
    icon: jsLibIcon("MrRio"),
  },
  {
    name: "@amplitude/analytics-browser",
    description: "Official Amplitude SDK for Web",
    author: "amplitude",
    docsURL:
      "https://github.com/amplitude/Amplitude-TypeScript/tree/main/packages/analytics-browser#usage",
    version: "1.6.1",
    url: "https://cdn.jsdelivr.net/npm/@amplitude/analytics-browser@1.6.1/lib/scripts/amplitude-min.umd.js",
    icon: jsLibIcon("amplitude"),
  },
  {
    name: "@supabase/supabase-js",
    description: "Isomorphic Javascript client for Supabase",
    author: "supabase",
    docsURL: "https://supabase.com/docs/reference/javascript",
    version: "2.4.0",
    url: "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.4.0/dist/umd/supabase.min.js",
    icon: jsLibIcon("supabase"),
  },
  {
    name: "uuidjs",
    url: "https://cdn.jsdelivr.net/npm/uuidjs@4.2.12/src/uuid.min.js",
    description:
      "UUID.js is a JavaScript/ECMAScript library to generate RFC 4122 compliant Universally Unique IDentifiers (UUIDs). This library supports both version 4 UUIDs (UUIDs from random numbers) and version 1 UUIDs (time-based UUIDs), and provides an object-oriented interface to print a generated or parsed UUID in a variety of forms.",
    author: "LiosK",
    docsURL:
      "https://github.com/LiosK/UUID.js/#uuidjs---rfc-compliant-uuid-generator-for-javascript",
    version: "4.2.12",
    icon: jsLibIcon("LiosK"),
  },
  {
    name: "bcryptjs",
    url: "https://cdn.jsdelivr.net/npm/bcryptjs@2.4.3/dist/bcrypt.min.js",
    description: "A library to help you hash passwords",
    author: "dcodeIO",
    docsURL: "https://github.com/dcodeIO/bcrypt.js#bcryptjs",
    version: "2.4.3",
    icon: jsLibIcon("dcodeIO"),
  },
  {
    name: "Papa Parse 5",
    description:
      "Fast and powerful CSV (delimited text) parser that gracefully handles large files and malformed input",
    author: "mholt",
    docsURL: "https://www.papaparse.com/docs",
    version: "5.3.2",
    url: `https://unpkg.com/papaparse@5.3.2/papaparse.min.js`,
    icon: jsLibIcon("mholt"),
  },
  {
    name: "ky",
    description: "Tiny and elegant HTTP client based on the browser Fetch API",
    author: "sindresorhus",
    docsURL: "https://github.com/sindresorhus/ky#usage",
    version: "0.25.0",
    url: "https://www.unpkg.com/ky@0.25.0/umd.js",
    icon: jsLibIcon("sindresorhus"),
  },
  {
    name: "appwrite",
    url: "https://cdn.jsdelivr.net/npm/appwrite@10.2.0/dist/iife/sdk.min.js",
    description:
      "Appwrite is a secure end-to-end backend server for frontend and mobile developers",
    author: "appwrite",
    version: "10.2.0",
    icon: jsLibIcon("appwrite"),
    docsURL: "https://github.com/appwrite/sdk-for-web#getting-started",
  },
  {
    name: "i18next",
    url: "https://cdn.jsdelivr.net/npm/i18next@22.1.4/dist/umd/i18next.min.js",
    description: "i18next internationalization framework",
    author: "i18next",
    version: "22.1.4",
    icon: jsLibIcon("i18next"),
    docsURL: "https://www.i18next.com/overview/getting-started",
  },
  {
    name: "uzip-module",
    description: "Module version of UZIP.js",
    author: "greggman",
    docsURL: "https://github.com/greggman/uzip-module#uzip-module",
    version: "1.0.3",
    url: `https://cdn.jsdelivr.net/npm/uzip-module@1.0.3/dist/uzip.js`,
    icon: jsLibIcon("greggman"),
  },
  {
    name: "@sentry/browser",
    description: "Official Sentry SDK for browsers",
    author: "getsentry",
    docsURL: "https://docs.sentry.io/platforms/javascript/",
    version: "7.17.3",
    url: "https://browser.sentry-cdn.com/7.17.3/bundle.min.js",
    icon: jsLibIcon("getsentry"),
  },
  {
    name: "jsonpath",
    url: "https://cdn.jsdelivr.net/npm/jsonpath@1.1.1/jsonpath.min.js",
    description:
      "Query JavaScript objects with JSONPath expressions. Robust / safe JSONPath engine for Node.js",
    version: "1.1.1",
    author: "dchester",
    docsURL: "https://github.com/dchester/jsonpath/#jsonpath",
    icon: jsLibIcon("dchester"),
  },
  // We'll be enabling support for segment soon
  // {
  //   name: "@segment/analytics-next",
  //   url:
  //     "https://cdn.jsdelivr.net/npm/@segment/analytics-next@1.46.1/dist/umd/index.js",
  //   description:
  //     "Analytics Next (aka Analytics 2.0) is the latest version of Segment's JavaScript SDK - enabling you to send your data to any tool without having to learn, test, or use a new API every time.",
  //   author: "segmentio",
  //   docsURL:
  //     "https://github.com/segmentio/analytics-next/tree/master/packages/browser#readme",
  //   version: "1.46.1",
  //   icon: jsLibIcon("segmentio"),
  // },
];
