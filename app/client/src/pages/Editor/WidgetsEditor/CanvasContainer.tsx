import React, { ReactNode } from "react";
import { useSelector } from "react-redux";
import {
  getCurrentPageId,
  getIsFetchingPage,
  getCanvasWidgetDsl,
} from "selectors/editorSelectors";
import styled from "styled-components";
import { getCanvasClassName } from "utils/generators";

import Centered from "components/designSystems/appsmith/CenteredWrapper";
import { Spinner } from "@blueprintjs/core";
import Canvas from "../Canvas";
import { useParams } from "react-router";

const Container = styled.section`
  width: 100%;
  height: calc(100% - 2.25rem);
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

function CanvasContainer() {
  const currentPageId = useSelector(getCurrentPageId);
  const isFetchingPage = useSelector(getIsFetchingPage);
  const widgets = useSelector(getCanvasWidgetDsl);
  const params = useParams<{ applicationId: string; pageId: string }>();

  const pageLoading = (
    <Centered>
      <Spinner />
    </Centered>
  );
  let node: ReactNode;
  if (isFetchingPage) {
    node = pageLoading;
  }

  if (!isFetchingPage && widgets) {
    node = <Canvas dsl={widgets} pageId={params.pageId} />;
  }

  return (
    <Container
      className={`${getCanvasClassName()} text-white scrollbar-thin mt-9`}
      key={currentPageId}
    >
      {node}
    </Container>
  );
}

export default CanvasContainer;
