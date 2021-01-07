import React, { useCallback } from "react";
import styled from "styled-components";
import { scrollbarDark } from "constants/DefaultTheme";
import Loading from "./Loading";
import DBQueryGroup from "./DBQueryGroup";
import { useSelector } from "react-redux";
import { AppState } from "reducers";
import { IPanelProps } from "@blueprintjs/core";
import { BUILDER_PAGE_URL } from "constants/routes";
import WidgetSidebar from "pages/Editor/WidgetSidebar";
import { useParams } from "react-router";
import { ExplorerURLParams } from "../helpers";
import history from "utils/history";

const Wrapper = styled.div`
  height: 100%;
  overflow-y: scroll;
  ${scrollbarDark};
`;

const OnboardingExplorer = (props: IPanelProps) => {
  let node = <Loading />;
  const { applicationId, pageId } = useParams<ExplorerURLParams>();
  const { openPanel } = props;
  const showWidgetsSidebar = useCallback(() => {
    history.push(BUILDER_PAGE_URL(applicationId, pageId));
    openPanel({ component: WidgetSidebar });
  }, [openPanel, applicationId, pageId]);

  const createdDBQuery = useSelector(
    (state: AppState) => state.ui.onBoarding.createdDBQuery,
  );
  if (createdDBQuery) {
    node = <DBQueryGroup showWidgetsSidebar={showWidgetsSidebar} />;
  }

  return <Wrapper>{node}</Wrapper>;
};

export default OnboardingExplorer;
