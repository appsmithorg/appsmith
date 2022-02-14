import React, { useEffect } from "react";
import styled from "styled-components";
import * as Sentry from "@sentry/react";
import { Switch, Route, useRouteMatch } from "react-router-dom";
import TemplateList from "./TemplateList";
import TemplateView from "./TemplateView";
import { useDispatch, useSelector } from "react-redux";
import { setHeaderMeta } from "actions/themeActions";
import { getAllTemplates } from "actions/templateActions";
import {
  getOrganizationForTemplates,
  getTemplatesSelector,
} from "selectors/templatesSelectors";
import { fetchPlugins } from "actions/pluginActions";
import { Classes } from "@blueprintjs/core";
import { getIsFetchingApplications } from "selectors/applicationSelectors";
import { editorInitializer } from "utils/EditorUtils";
const SentryRoute = Sentry.withSentryRouting(Route);

const TemplateListWrapper = styled.div`
  padding-top: 26px;
  width: calc(100% - ${(props) => props.theme.homePage.sidebar}px);
`;

const ResultsCount = styled.div`
  font-size: 18px;
  font-weight: 500;
  color: #090707;
  margin-top: 26px;
  margin-left: 32px;
`;

const Loader = styled(TemplateListWrapper)`
  height: 100vh;
  .results-count {
    height: 20px;
    width: 100px;
  }
`;

const LoadingTemplateList = styled.div`
  margin-top: 24px;
  height: calc(100% - 200px);
  margin-right: 20px;
  margin-left: 32px;
`;

function TemplateRoutes() {
  const { path } = useRouteMatch();
  const dispatch = useDispatch();
  const templateOrganization = useSelector(getOrganizationForTemplates);

  useEffect(() => {
    dispatch(setHeaderMeta(true, true));
    // Generate the widget config list
    editorInitializer();
  }, []);

  useEffect(() => {
    if (templateOrganization?.organization.id) {
      dispatch(fetchPlugins(templateOrganization?.organization.id));
    }
  }, [templateOrganization?.organization.id]);

  return (
    <Switch>
      <SentryRoute component={TemplateView} path={`${path}/:templateId`} />
      <SentryRoute component={Templates} path={path} />
    </Switch>
  );
}

function Templates() {
  const dispatch = useDispatch();
  useEffect(() => {
    dispatch(getAllTemplates());
  }, []);

  const templates = useSelector(getTemplatesSelector);
  const isFetchingApplications = useSelector(getIsFetchingApplications);
  const resultsText =
    templates.length > 1
      ? `Showing all ${templates.length} templates`
      : "Showing 1 template";

  if (isFetchingApplications) {
    return (
      <Loader>
        <ResultsCount className={`results-count ${Classes.SKELETON}`} />
        <LoadingTemplateList className={Classes.SKELETON} />
      </Loader>
    );
  }

  return (
    <TemplateListWrapper>
      <ResultsCount>{resultsText}</ResultsCount>
      <TemplateList templates={templates} />
    </TemplateListWrapper>
  );
}

export default TemplateRoutes;
