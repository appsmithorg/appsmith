import React, { lazy, Suspense } from "react";
import { retryPromise } from "utils/AppsmithUtils";
import Skeleton from "components/utils/Skeleton";

const LazyPluginActionEditor = lazy(async () =>
  retryPromise(
    async () =>
      import(/* webpackChunkName: "AppPluginActionEditor" */ "./index"),
  ),
);

const AppPluginActionEditor = () => {
  return (
    <Suspense fallback={Skeleton}>
      <LazyPluginActionEditor />
    </Suspense>
  );
};

export default AppPluginActionEditor;
