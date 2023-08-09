import React from "react";
import PageLoadingBar from "pages/common/PageLoadingBar";
import { retryPromise } from "utils/AppsmithUtils";
import { useSelector } from "react-redux";
import { getCurrentUserLoading } from "selectors/usersSelectors";
import { getIsTenantLoading } from "@appsmith/selectors/tenantSelectors";

const Page = React.lazy(() =>
  retryPromise(
    () =>
      import(
        /* webpackChunkName: "settings" */ "@appsmith/pages/AdminSettings/index"
      ),
  ),
);

const AdminSettingsLoader = (props: any) => {
  const tenantIsLoading = useSelector(getIsTenantLoading);
  const currentUserIsLoading = useSelector(getCurrentUserLoading);
  if (tenantIsLoading || currentUserIsLoading) return null;
  return (
    <React.Suspense fallback={<PageLoadingBar />}>
      <Page {...props} />
    </React.Suspense>
  );
};

export default AdminSettingsLoader;
