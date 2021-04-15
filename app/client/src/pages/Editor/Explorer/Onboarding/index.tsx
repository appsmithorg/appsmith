import React, { useCallback } from "react";
import styled from "styled-components";
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
import ScrollIndicator from "components/ads/ScrollIndicator";

const Wrapper = styled.div`
  height: 100%;
  overflow-y: auto;
`;

const OnboardingExplorer = (props: IPanelProps) => {
  const wrapperRef = React.createRef<HTMLDivElement>();

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

  return (
    <Wrapper ref={wrapperRef}>
      {node}
      <ScrollIndicator containerRef={wrapperRef} mode="DARK" />
    </Wrapper>
  );
};

export default OnboardingExplorer;
