import React, { lazy, Suspense } from "react";
import { retryPromise } from "utils/AppsmithUtils";
import Skeleton from "components/utils/Skeleton";

const LazyAddQuery = lazy(async () =>
  retryPromise(
    async () => import(/* webpackChunkName: "AddQuery" */ "./QueryAddView"),
  ),
);

const QueryAdd = () => {
  return (
    <Suspense fallback={Skeleton}>
      <LazyAddQuery />
    </Suspense>
  );
};

export default QueryAdd;
