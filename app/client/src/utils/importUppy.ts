// We’re setting this flag to true when we know for sure the Uppy module was loaded and initialized.
// When it’s `true`, the other modules will know that the importUppy function will resolve immediately
// (in the next tick). They can use it to e.g. decide whether to show the loading spinner
export let isUppyLoaded = false;

export async function importUppy() {
  const [Uppy, Dashboard, GoogleDrive, OneDrive, Url, Webcam] =
    await Promise.all([
      import(/* webpackChunkName: "uppy" */ "@uppy/core").then(
        (m) => m.default,
      ),
      import(/* webpackChunkName: "uppy" */ "@uppy/dashboard").then(
        (m) => m.default,
      ),
      import(/* webpackChunkName: "uppy" */ "@uppy/google-drive").then(
        (m) => m.default,
      ),
      import(/* webpackChunkName: "uppy" */ "@uppy/onedrive").then(
        (m) => m.default,
      ),
      import(/* webpackChunkName: "uppy" */ "@uppy/url").then((m) => m.default),
      import(/* webpackChunkName: "uppy" */ "@uppy/webcam").then(
        (m) => m.default,
      ),
    ]);

  isUppyLoaded = true;

  return {
    Uppy,
    Dashboard,
    GoogleDrive,
    OneDrive,
    Url,
    Webcam,
  };
}
