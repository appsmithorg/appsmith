import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { RouteComponentProps } from "react-router";

import {
  fetchModuleActions,
  setCurrentModule,
} from "@appsmith/actions/moduleActions";
import { SentryRoute } from "@appsmith/AppRouter";
import ModuleQueryEditor from "./ModuleQueryEditor";
import {
  DATA_SOURCES_EDITOR_ID_PATH,
  INTEGRATION_EDITOR_PATH,
  MODULE_API_EDITOR_PATH,
  MODULE_QUERY_EDITOR_PATH,
  SAAS_EDITOR_API_ID_PATH,
  SAAS_EDITOR_DATASOURCE_ID_PATH,
} from "@appsmith/constants/routes/packageRoutes";
import ModuleApiEditor from "./ModuleApiEditor";
import {
  getIsModuleFetchingActions,
  getModuleById,
} from "@appsmith/selectors/modulesSelector";
import { Spinner } from "design-system";
import CenteredWrapper from "components/designSystems/appsmith/CenteredWrapper";
import styled from "styled-components";
import ModuleEditorDefaultRedirect from "./ModuleEditorDefaultRedirect";
import IntegrationEditor from "pages/Editor/IntegrationEditor";
import DatasourceForm from "pages/Editor/SaaSEditor/DatasourceForm";
import DataSourceEditor from "pages/Editor/DataSourceEditor";
import urlBuilder from "@appsmith/entities/URLRedirect/URLAssembly";

interface RouteProps {
  moduleId: string;
}

export type ModuleEditorProps = RouteComponentProps<RouteProps>;

const LoadingContainer = styled(CenteredWrapper)`
  height: 50%;
`;

function ModuleEditor({ match }: ModuleEditorProps) {
  const { moduleId } = match.params;
  const dispatch = useDispatch();
  const isModuleFetchingActions = useSelector(getIsModuleFetchingActions);
  const module = useSelector((state) => getModuleById(state, moduleId));

  useEffect(() => {
    dispatch(fetchModuleActions({ moduleId }));
  }, [moduleId]);

  useEffect(() => {
    dispatch(setCurrentModule(moduleId));
    urlBuilder.setCurrentModuleId(moduleId);

    return () => {
      dispatch(setCurrentModule(null));
      urlBuilder.setCurrentModuleId(null);
    };
  }, [moduleId]);

  if (!module) return null;

  if (isModuleFetchingActions) {
    return (
      <LoadingContainer>
        <Spinner size={30} />
      </LoadingContainer>
    );
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
        component={IntegrationEditor}
        exact
        path={`${match.path}${INTEGRATION_EDITOR_PATH}`}
      />
      <SentryRoute
        component={DataSourceEditor}
        exact
        path={`${match.path}${DATA_SOURCES_EDITOR_ID_PATH}`}
      />
      <SentryRoute
        component={DatasourceForm}
        exact
        path={`${match.path}${SAAS_EDITOR_DATASOURCE_ID_PATH}`}
      />
      {/* Redirect to default url */}
      <ModuleEditorDefaultRedirect module={module} />
    </>
  );
}

export default ModuleEditor;
