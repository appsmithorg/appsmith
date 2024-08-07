import { isAirgapped } from "ee/utils/airgapHelpers";

async function loadScript(src: string) {
  return new Promise(function (resolve, reject) {
    const s = document.createElement("script");
    s.src = src;
    s.onload = resolve;
    s.onerror = reject;
    s.crossOrigin = "anonymous";
    s.id = "googleapis";
    const headElement = document.getElementsByTagName("head")[0];
    headElement && headElement.appendChild(s);
  });
}

export const executeGoogleApi = async () => {
  const airGapped = isAirgapped();
  // if the googleAPIsLoaded is already loaded, do not load it again.
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (airGapped || (window as any).googleAPIsLoaded) {
    return;
  }
  const gapiLoaded = () => {
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).googleAPIsLoaded = true;
  };
  const onError = () => {
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).googleAPIsLoaded = false;
  };

  await loadScript("https://apis.google.com/js/api.js").then(
    gapiLoaded,
    onError,
  );
};
