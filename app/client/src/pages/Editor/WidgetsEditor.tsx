import React, { useEffect, ReactNode } from "react";
import { connect } from "react-redux";
import { useParams } from "react-router-dom";
import styled from "styled-components";
import Canvas from "./Canvas";
import { AppState } from "reducers";
import { WidgetProps } from "widgets/BaseWidget";
import { fetchPage, savePage } from "actions/pageActions";
import {
  getDenormalizedDSL,
  getIsFetchingPage,
  getCurrentPageId,
} from "selectors/editorSelectors";
import { ContainerWidgetProps } from "widgets/ContainerWidget";
import { BuilderRouteParams } from "constants/routes";
import Centered from "components/designSystems/appsmith/CenteredWrapper";
import EditorContextProvider from "components/editorComponents/EditorContextProvider";
import { Spinner } from "@blueprintjs/core";

const EditorWrapper = styled.div`
  display: flex;
  flex-direction: row;
  align-items: stretch;
  justify-content: flex-start;
  overflow: hidden;
  height: calc(100vh - ${props => props.theme.headerHeight});
`;

const CanvasContainer = styled.section`
  height: 100%;
  width: 100%;
  position: relative;
  overflow-x: auto;
  overflow-y: auto;
  &:before {
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
    pointer-events: none;
  }
`;

type EditorProps = {
  dsl?: ContainerWidgetProps<WidgetProps>;
  savePageLayout: Function;
  fetchPage: (pageId: string) => void;
  currentPageId?: string;
  isFetchingPage: boolean;
};

const WidgetsEditor = (props: EditorProps) => {
  const params = useParams<BuilderRouteParams>();
  const { pageId } = params;

  /* eslint-disable react-hooks/exhaustive-deps */
  useEffect(() => {
    if (pageId !== props.currentPageId) {
      props.fetchPage(pageId);
    }
  }, [pageId]);

  const pageLoading = (
    <Centered>
      <Spinner />
    </Centered>
  );
  let node: ReactNode;
  if (props.isFetchingPage) {
    node = pageLoading;
  }
  if (!props.isFetchingPage && props.dsl) {
    node = <Canvas dsl={props.dsl} />;
  }
  return (
    <EditorContextProvider>
      <EditorWrapper>
        <CanvasContainer>{node}</CanvasContainer>
      </EditorWrapper>
    </EditorContextProvider>
  );
};

const mapStateToProps = (state: AppState) => {
  return {
    dsl: getDenormalizedDSL(state),
    isFetchingPage: getIsFetchingPage(state),
    currentPageId: getCurrentPageId(state),
  };
};

const mapDispatchToProps = (dispatch: any) => {
  return {
    savePageLayout: (
      pageId: string,
      layoutId: string,
      dsl: ContainerWidgetProps<WidgetProps>,
    ) => dispatch(savePage(pageId, layoutId, dsl)),
    fetchPage: (pageId: string) => dispatch(fetchPage(pageId)),
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(WidgetsEditor);
