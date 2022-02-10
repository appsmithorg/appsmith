import React, { useEffect } from "react";
import styled from "styled-components";
import * as Sentry from "@sentry/react";
import { Switch, Route, useRouteMatch } from "react-router-dom";
import TemplateList from "./TemplateList";
import TemplateView from "./TemplateView";
import { useDispatch, useSelector } from "react-redux";
import { setHeaderMeta } from "actions/themeActions";
import { getAllTemplates } from "actions/templateActions";
import { getTemplatesSelector } from "selectors/templatesSelectors";
const SentryRoute = Sentry.withSentryRouting(Route);

const TemplateListWrapper = styled.div`
  padding-top: 26px;
  width: calc(100% - ${(props) => props.theme.homePage.sidebar}px);
`;

const ResultsCount = styled.span`
  font-size: 18px;
  font-weight: 500;
  color: #090707;
  margin-top: 26px;
  margin-left: 32px;
`;

function TemplateRoutes() {
  const { path } = useRouteMatch();
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(setHeaderMeta(true, true));
  }, []);

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
  const resultsText =
    templates.length > 1
      ? `Showing all ${templates.length} templates`
      : "Showing 1 template";

  return (
    <TemplateListWrapper>
      <ResultsCount>{resultsText}</ResultsCount>
      <TemplateList templates={templates} />
    </TemplateListWrapper>
  );
}

export default TemplateRoutes;
