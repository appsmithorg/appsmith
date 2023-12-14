import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { RouteComponentProps } from "react-router";

import { setCurrentModule, setupModule } from "@appsmith/actions/moduleActions";
import {
  getIsModuleFetchingActions,
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
  SAAS_EDITOR_API_ID_PATH,
} from "@appsmith/constants/routes/packageRoutes";

interface RouteProps {
  moduleId: string;
}

export type ModuleEditorProps = RouteComponentProps<RouteProps>;

function ModuleEditor({ match }: ModuleEditorProps) {
  const { moduleId } = match.params;
  const dispatch = useDispatch();
  const isModuleFetchingActions = useSelector(getIsModuleFetchingActions);
  const isModuleFetchingEntities = useSelector(getIsModuleFetchingEntities);
  const module = useSelector((state) => getModuleById(state, moduleId));

  useEffect(() => {
    dispatch(setupModule({ moduleId }));
  }, [moduleId]);

  useEffect(() => {
    urlBuilder.setCurrentModuleId(moduleId);

    return () => {
      dispatch(setCurrentModule(undefined));
      urlBuilder.setCurrentModuleId(undefined);
    };
  }, [moduleId]);

  if (!module) return null;

  if (isModuleFetchingActions || isModuleFetchingEntities) {
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
