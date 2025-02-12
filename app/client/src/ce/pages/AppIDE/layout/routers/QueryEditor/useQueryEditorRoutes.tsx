import React, { lazy, Suspense, useMemo } from "react";
import { retryPromise } from "utils/AppsmithUtils";
import type { UseRoutes } from "IDE/Interfaces/UseRoutes";
import Skeleton from "widgets/Skeleton";
import {
  ADD_PATH,
  API_EDITOR_ID_PATH,
  BUILDER_CUSTOM_PATH,
  BUILDER_PATH,
  BUILDER_PATH_DEPRECATED,
} from "ee/constants/routes/appRoutes";
import { SAAS_EDITOR_API_ID_PATH } from "pages/Editor/SaaSEditor/constants";

const PluginActionEditor = lazy(async () =>
  retryPromise(
    async () =>
      import(
        /* webpackChunkName: "PluginActionEditor" */ "pages/Editor/AppPluginActionEditor"
      ),
  ),
);
const AddQuery = lazy(async () =>
  retryPromise(
    async () =>
      import(
        /* webpackChunkName: "AddQuery" */ "pages/AppIDE/components/QueryAdd/QueryAddView"
      ),
  ),
);
const QueryEmpty = lazy(async () =>
  retryPromise(
    async () =>
      import(
        /* webpackChunkName: "QueryEmpty" */ "PluginActionEditor/components/PluginActionForm/components/UQIEditor/QueriesBlankState"
      ),
  ),
);

export const useQueryEditorRoutes = (path: string): UseRoutes => {
  const skeleton = useMemo(() => <Skeleton />, []);

  return useMemo(
    () => [
      {
        key: "AddQuery",
        exact: true,
        component: () => (
          <Suspense fallback={skeleton}>
            <AddQuery />
          </Suspense>
        ),
        path: [`${path}${ADD_PATH}`, `${path}/:baseQueryId${ADD_PATH}`],
      },
      {
        key: "PluginActionEditor",
        component: () => {
          return (
            <Suspense fallback={skeleton}>
              <PluginActionEditor />
            </Suspense>
          );
        },
        path: [
          BUILDER_PATH + API_EDITOR_ID_PATH,
          BUILDER_CUSTOM_PATH + API_EDITOR_ID_PATH,
          BUILDER_PATH_DEPRECATED + API_EDITOR_ID_PATH,
          BUILDER_PATH + SAAS_EDITOR_API_ID_PATH,
          BUILDER_CUSTOM_PATH + SAAS_EDITOR_API_ID_PATH,
          BUILDER_PATH_DEPRECATED + SAAS_EDITOR_API_ID_PATH,
          path + "/:baseQueryId",
        ],
        exact: true,
      },
      {
        key: "QueryEmpty",
        component: () => (
          <Suspense fallback={skeleton}>
            <QueryEmpty />
          </Suspense>
        ),
        exact: true,
        path: [path],
      },
    ],
    [path, skeleton],
  );
};
