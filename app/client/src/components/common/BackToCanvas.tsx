import React, { useCallback, useContext } from "react";
import styled from "styled-components";
import { Link } from "@appsmith/ads";

import history from "utils/history";
import WalkthroughContext from "components/featureWalkthrough/walkthroughContext";
import { BACK_TO_CANVAS, createMessage } from "ee/constants/messages";
import { builderURL } from "ee/RouteBuilder";

const BackToCanvasLink = styled(Link)`
  margin-left: ${(props) => props.theme.spaces[1] + 1}px;
  margin-top: ${(props) => props.theme.spaces[11]}px;
  padding-bottom: ${(props) => props.theme.spaces[11]}px;
`;

interface BackToCanvasProps {
  basePageId: string;
}

function BackToCanvas({ basePageId }: BackToCanvasProps) {
  const { isOpened: isWalkthroughOpened, popFeature } =
    useContext(WalkthroughContext) || {};

  const handleCloseWalkthrough = useCallback(() => {
    if (isWalkthroughOpened && popFeature) {
      popFeature();
    }
  }, [isWalkthroughOpened, popFeature]);

  return (
    <BackToCanvasLink
      id="back-to-canvas"
      kind="secondary"
      onClick={() => {
        history.push(builderURL({ basePageId }));

        handleCloseWalkthrough();
      }}
      startIcon="arrow-left-line"
    >
      {createMessage(BACK_TO_CANVAS)}
    </BackToCanvasLink>
  );
}

export default BackToCanvas;
