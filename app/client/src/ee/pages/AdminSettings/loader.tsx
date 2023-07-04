// ⚠️ Please keep this file in sync with ce/pages/AdminSettings/loader.tsx.
// We can’t just re-export ce/pages/AdminSettings/loader.tsx in ee/pages/AdminSettings/loader.tsx
// as the `import("./index")` path is relative to the file it’s in.
import React from "react";
import PageLoadingBar from "pages/common/PageLoadingBar";
import { retryPromise } from "utils/AppsmithUtils";

const Page = React.lazy(() =>
  retryPromise(() => import(/* webpackChunkName: "settings" */ "./index")),
);

const AdminSettingsLoader = (props: any) => {
  return (
    <React.Suspense fallback={<PageLoadingBar />}>
      <Page {...props} />
    </React.Suspense>
  );
};

export default AdminSettingsLoader;
