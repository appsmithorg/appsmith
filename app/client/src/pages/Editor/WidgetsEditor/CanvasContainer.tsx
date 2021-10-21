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
  position: relative;
  overflow-x: auto;
  overflow-y: auto;
  padding-top: 1px;
  &:before {
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
    pointer-events: none;
  }
`;

interface Props {
  zoom: number;
  transform: string;
}

function CanvasContainer(props: Props) {
  const { transform, zoom } = props;
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
      className={`${getCanvasClassName()} text-white scrollbar-thin origin-top mt-9 `}
      key={currentPageId}
      style={{
        transform,
        height: `calc(100% + 100% * ${zoom < 1 ? (1 - zoom) * 2 : 0})`,
      }}
    >
      {node}
    </Container>
  );
}

export default CanvasContainer;
