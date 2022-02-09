import React, { useEffect } from "react";
import styled from "styled-components";
import * as Sentry from "@sentry/react";
import { Switch, Route, useRouteMatch } from "react-router-dom";
import TemplateList from "./TemplateList";
import TemplateView from "./TemplateView";
import { useDispatch } from "react-redux";
import { setHeaderMeta } from "actions/themeActions";
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
      <SentryRoute component={TemplateView} path={`${path}/templateId`} />
      <SentryRoute component={Templates} path={path} />
    </Switch>
  );
}

function Templates() {
  return (
    <TemplateListWrapper>
      <ResultsCount>Showing all 20 templates</ResultsCount>
      <TemplateList />
    </TemplateListWrapper>
  );
}

export default TemplateRoutes;
