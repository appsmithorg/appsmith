import React from "react";
import PageLoadingBar from "pages/common/PageLoadingBar";
import { retryPromise } from "utils/AppsmithUtils";

const Page = React.lazy(async () =>
  retryPromise(
    async () =>
      import(/* webpackChunkName: "settings" */ "pages/AdminSettings/index"),
  ),
);

// TODO: Fix this the next time the file is edited
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const AdminSettingsLoader = (props: any) => {
  return (
    <React.Suspense fallback={<PageLoadingBar />}>
      <Page {...props} />
    </React.Suspense>
  );
};

export default AdminSettingsLoader;
