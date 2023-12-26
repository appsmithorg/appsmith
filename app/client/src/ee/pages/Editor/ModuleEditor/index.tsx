import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { RouteComponentProps } from "react-router";

import { setCurrentModule, setupModule } from "@appsmith/actions/moduleActions";
import {
  getIsModuleFetchingEntities,
  getModuleById,
} from "@appsmith/selectors/modulesSelector";
import ModuleEditorDefaultRedirect from "./ModuleEditorDefaultRedirect";
import urlBuilder from "@appsmith/entities/URLRedirect/URLAssembly";
import Loader from "./Loader";
import { SentryRoute } from "@appsmith/AppRouter";
import ModuleQueryEditor from "./ModuleQueryEditor";
import ModuleApiEditor from "./ModuleApiEditor";
import ModuleJSEditor from "./ModuleJSEditor";
import {
  MODULE_API_EDITOR_PATH,
  MODULE_JS_COLLECTION_EDITOR_PATH,
  MODULE_QUERY_EDITOR_PATH,
} from "@appsmith/constants/routes/packageRoutes";
import { SAAS_EDITOR_API_ID_PATH } from "pages/Editor/SaaSEditor/constants";
import useLastVisitedModule from "../PackageEditor/PackageIDE/MainPane/useLastVisitedModule";

interface RouteProps {
  moduleId: string;
  packageId: string;
}

export type ModuleEditorProps = RouteComponentProps<RouteProps>;

function ModuleEditor({ match }: ModuleEditorProps) {
  const { moduleId, packageId } = match.params;
  const dispatch = useDispatch();
  const isModuleFetchingEntities = useSelector(getIsModuleFetchingEntities);
  const module = useSelector((state) => getModuleById(state, moduleId));
  const { logLastVisited } = useLastVisitedModule({ packageId });

  useEffect(() => {
    dispatch(setupModule({ moduleId }));
  }, [moduleId]);

  useEffect(() => {
    urlBuilder.setCurrentModuleId(moduleId);

    return () => {
      dispatch(setCurrentModule(undefined));
      urlBuilder.setCurrentModuleId(undefined);
      logLastVisited({ moduleId });
    };
  }, [moduleId, logLastVisited]);

  if (!module) return null;

  if (isModuleFetchingEntities) {
    return <Loader />;
  }

  return (
    <>
      <SentryRoute
        component={ModuleQueryEditor}
        path={`${match.path}${MODULE_QUERY_EDITOR_PATH}`}
      />
      <SentryRoute
        component={ModuleQueryEditor}
        path={`${match.path}${SAAS_EDITOR_API_ID_PATH}`}
      />
      <SentryRoute
        component={ModuleApiEditor}
        path={`${match.path}${MODULE_API_EDITOR_PATH}`}
      />
      <SentryRoute
        component={ModuleJSEditor}
        exact
        path={`${match.path}${MODULE_JS_COLLECTION_EDITOR_PATH}`}
      />
      {/* Redirect to default url */}
      <ModuleEditorDefaultRedirect module={module} />
    </>
  );
}

export default ModuleEditor;
