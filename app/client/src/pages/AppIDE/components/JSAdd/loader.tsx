import React, { lazy, Suspense } from "react";
import Skeleton from "components/utils/Skeleton";
import { retryPromise } from "utils/AppsmithUtils";

const LazyAddJS = lazy(async () =>
  retryPromise(
    async () => import(/* webpackChunkName: "AddJS" */ "./JSAddView"),
  ),
);

const AddJS = () => {
  return (
    <Suspense fallback={<Skeleton />}>
      <LazyAddJS />
    </Suspense>
  );
};

export default AddJS;
