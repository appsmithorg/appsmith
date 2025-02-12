import React, { lazy, Suspense } from "react";
import { retryPromise } from "utils/AppsmithUtils";
import type { UseRoutes } from "IDE/Interfaces/UseRoutes";
import Skeleton from "widgets/Skeleton";
import { ADD_PATH } from "ee/constants/routes/appRoutes";

const AddJS = lazy(async () =>
  retryPromise(
    async () =>
      import(
        /* webpackChunkName: "AddJS" */ "pages/AppIDE/components/JSAdd/JSAddView"
      ),
  ),
);
const JSEditor = lazy(async () =>
  retryPromise(
    async () =>
      import(/* webpackChunkName: "JSEditor" */ "pages/Editor/JSEditor"),
  ),
);
const JSEmpty = lazy(async () =>
  retryPromise(
    async () =>
      import(
        /* webpackChunkName: "JSEmpty" */ "pages/Editor/JSEditor/JSBlankState"
      ),
  ),
);

export const useJSEditorRoutes = (path: string): UseRoutes => {
  return [
    {
      exact: true,
      key: "AddJS",
      component: (args) => (
        <Suspense fallback={<Skeleton />}>
          <AddJS {...args} />
        </Suspense>
      ),
      path: [`${path}${ADD_PATH}`, `${path}/:baseCollectionId${ADD_PATH}`],
    },
    {
      exact: true,
      key: "JSEditor",
      component: (args) => (
        <Suspense fallback={<Skeleton />}>
          <JSEditor {...args} />
        </Suspense>
      ),
      path: [path + "/:baseCollectionId"],
    },
    {
      key: "JSEmpty",
      component: (args) => (
        <Suspense fallback={<Skeleton />}>
          <JSEmpty {...args} />
        </Suspense>
      ),
      exact: true,
      path: [path],
    },
  ];
};
