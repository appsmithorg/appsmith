import { getAllApplications } from "@appsmith/actions/applicationActions";
import type { AppState } from "@appsmith/reducers";
import { getUserApplicationsWorkspacesList } from "@appsmith/selectors/applicationSelectors";
import * as Sentry from "@sentry/react";
import { fetchDefaultPlugins } from "actions/pluginActions";
import { getAllTemplates, getTemplateFilters } from "actions/templateActions";
import { setHeaderMeta } from "actions/themeActions";
import { Text } from "design-system";
import { isEmpty } from "lodash";
import ReconnectDatasourceModal from "pages/Editor/gitSync/ReconnectDatasourceModal";
import LeftPaneBottomSection from "pages/Home/LeftPaneBottomSection";
import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Route, Switch, useRouteMatch } from "react-router-dom";
import {
  allTemplatesFiltersSelector,
  getForkableWorkspaces,
} from "selectors/templatesSelectors";
import styled from "styled-components";
import { editorInitializer } from "utils/editor/EditorUtils";
import { StartWithTemplateContent } from "./StartWithTemplateContent";
import StartWithTemplateFilters from "./StartWithTemplateFilter";
import TemplateView from "./TemplateView";

const SentryRoute = Sentry.withSentryRouting(Route);

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
    (state: AppState) => getUserApplicationsWorkspacesList(state).length,
  );
  const pluginListLength = useSelector(
    (state: AppState) => state.entities.plugins.defaultPluginList.length,
  );
  const templatesCount = useSelector(
    (state: AppState) => state.ui.templates.templates.length,
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
      dispatch(getAllApplications());
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
          <StartWithTemplateFilters />
          <LeftPaneBottomSection />
        </SecondaryWrapper>
      </SidebarWrapper>
      <TemplateListWrapper>
        <StartWithTemplateContent isForkingEnabled={!!workspaceList.length} />
      </TemplateListWrapper>
    </PageWrapper>
  );
}

export default TemplateRoutes;
