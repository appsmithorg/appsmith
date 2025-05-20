import type { DefaultRootState } from "react-redux";
import { fetchDefaultPlugins } from "actions/pluginActions";
import { getAllTemplates, getTemplateFilters } from "actions/templateActions";
import { setHeaderMeta } from "actions/themeActions";
import { Text } from "@appsmith/ads";
import { isEmpty } from "lodash";
import ReconnectDatasourceModal from "pages/Editor/gitSync/ReconnectDatasourceModal";
import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Switch, useRouteMatch } from "react-router-dom";
import {
  allTemplatesFiltersSelector,
  getForkableWorkspaces,
} from "selectors/templatesSelectors";
import styled from "styled-components";
import { editorInitializer } from "utils/editor/EditorUtils";

import { fetchAllWorkspaces } from "ee/actions/workspaceActions";
import TemplateFilters from "./TemplateFilters";
import { TemplateContent } from "./TemplateContent";
import TemplateView from "./TemplateView";
import { getFetchedWorkspaces } from "ee/selectors/workspaceSelectors";
import { SentryRoute } from "components/SentryRoute";

const PageWrapper = styled.div`
  margin-top: ${(props) => props.theme.homePage.header}px;
  background-color: var(--ads-v2-color-gray-50);
`;

const SidebarWrapper = styled.div`
  width: ${(props) => props.theme.homePage.sidebar}px;
  height: 100%;
  display: flex;
  padding: 25px 16px 0;
  flex-direction: column;
  position: fixed;
`;

const SecondaryWrapper = styled.div`
  height: calc(
    100vh - ${(props) => props.theme.homePage.header + props.theme.spaces[11]}px
  );
  position: relative;
`;

export const TemplateListWrapper = styled.div`
  padding-top: ${(props) => props.theme.spaces[11]}px;
  width: calc(100% - ${(props) => props.theme.homePage.sidebar}px);
  min-height: 100vh;
  margin-left: ${(props) => props.theme.homePage.sidebar}px;
`;

export const ResultsCount = styled(Text)`
  color: var(--ads-v2-color-fg-emphasis);
  margin-top: 20px;
  margin-left: ${(props) => props.theme.spaces[12] - 8}px;
  padding-bottom: 20px;
`;

function TemplateRoutes() {
  const { path } = useRouteMatch();
  const dispatch = useDispatch();
  const workspaceListLength = useSelector(
    (state: DefaultRootState) => getFetchedWorkspaces(state).length,
  );
  const pluginListLength = useSelector(
    (state: DefaultRootState) =>
      state.entities.plugins.defaultPluginList.length,
  );
  const templatesCount = useSelector(
    (state: DefaultRootState) => state.ui.templates.templates.length,
  );
  const filters = useSelector(allTemplatesFiltersSelector);

  useEffect(() => {
    dispatch(setHeaderMeta(true, true));
    // Generate the widget config list
    editorInitializer();
  }, []);

  useEffect(() => {
    if (!templatesCount) {
      dispatch(getAllTemplates());
    }
  }, [templatesCount]);

  useEffect(() => {
    if (!workspaceListLength) {
      dispatch(fetchAllWorkspaces());
    }
  }, [workspaceListLength]);

  useEffect(() => {
    if (!pluginListLength) {
      dispatch(fetchDefaultPlugins());
    }
  }, [pluginListLength]);

  useEffect(() => {
    if (isEmpty(filters.functions)) {
      dispatch(getTemplateFilters());
    }
  }, [filters]);

  return (
    <Switch>
      <SentryRoute component={TemplateView} path={`${path}/:templateId`} />
      <SentryRoute component={Templates} path={path} />
    </Switch>
  );
}

function Templates() {
  const workspaceList = useSelector(getForkableWorkspaces);

  return (
    <PageWrapper>
      <SidebarWrapper>
        <SecondaryWrapper>
          <ReconnectDatasourceModal />
          <TemplateFilters />
        </SecondaryWrapper>
      </SidebarWrapper>
      <TemplateListWrapper>
        <TemplateContent isForkingEnabled={!!workspaceList.length} />
      </TemplateListWrapper>
    </PageWrapper>
  );
}

export default TemplateRoutes;
