import React, { lazy, Suspense } from "react";
import Skeleton from "components/utils/Skeleton";
import { retryPromise } from "utils/AppsmithUtils";

const LazyJSEditor = lazy(async () =>
  retryPromise(
    async () => import(/* webpackChunkName: "JSEditor" */ "./index"),
  ),
);

const JSEditor = () => {
  return (
    <Suspense fallback={<Skeleton />}>
      <LazyJSEditor />
    </Suspense>
  );
};

export default JSEditor;
