// This file preloads chunks for the edit and view modes ahead of the import()
// call that will actually require them. This puts these chunks into HTTP cache
// (so they can be executed immediately) but doesn’t execute them (so that the
// `retryPromise()` logic around the import() calls can still work).
//
// The list of chunks to be preloaded is taken from `index.html`, as it’s only
// available from webpack stats in the end of the build.

declare global {
  interface Window {
    // __APPSMITH_CHUNKS_TO_PRELOAD is added in a script tag in index.html
    __APPSMITH_CHUNKS_TO_PRELOAD?: {
      "edit-mode": string[];
      "view-mode": string[];
    };
  }
}

const currentMode = getModeForPathname(window.location.pathname);
if (window.__APPSMITH_CHUNKS_TO_PRELOAD && currentMode) {
  window.__APPSMITH_CHUNKS_TO_PRELOAD[currentMode]
    // `fetchpriority="low"` ensures preloads don’t compete for bandwidth with the main script: https://3perf.slack.com/archives/C01SGCF8PM0/p1684511126862229?thread_ts=1684466888.430869&cid=C01SGCF8PM0
    .forEach((url) => {
      const link = document.createElement("link");
      link.rel = "preload";
      link.as = getPreloadValueForFile(url);
      link.href = url;
      document.head.appendChild(link);
    });
}

function getPreloadValueForFile(fileName: string) {
  if (fileName.endsWith(".js")) {
    return "script";
  } else if (fileName.endsWith(".css")) {
    return "style";
  }

  throw new Error(`Unknown preload type for file: ${fileName}`);
}

function getModeForPathname(
  pathname: string,
): keyof NonNullable<Window["__APPSMITH_CHUNKS_TO_PRELOAD"]> | null {
  if (/^\/app\/[^\/]+\/[^\/]+\/edit\b/.test(pathname)) {
    return "edit-mode";
  }

  if (pathname.startsWith("/app/")) {
    return "view-mode";
  }

  return null;
}

export {};
