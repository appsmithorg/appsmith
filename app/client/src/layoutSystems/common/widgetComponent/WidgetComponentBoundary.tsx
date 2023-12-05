import type { ReactNode } from "react";
import React, { useContext } from "react";
import styled from "styled-components";

import WalkthroughContext from "components/featureWalkthrough/walkthroughContext";
import { WIDGET_COMPONENT_BOUNDARY_CLASS } from "constants/componentClassNameConstants";

interface Props {
  children: ReactNode;
  widgetType: string;
}

const WidgetComponentBoundaryWrapper = styled.div`
  height: 100%;
  width: 100%;
`;

function WidgetComponentBoundary(props: Props) {
  const { isOpened: isWalkthroughOpened, popFeature } =
    useContext(WalkthroughContext) || {};

  const closeWalkthrough = () => {
    if (isWalkthroughOpened && popFeature) {
      popFeature("WIDGET_CONTAINER");
    }
  };

  const onClickHandler = () => {
    closeWalkthrough();
  };

  return (
    <WidgetComponentBoundaryWrapper
      className={WIDGET_COMPONENT_BOUNDARY_CLASS}
      onClick={onClickHandler}
    >
      {props.children}
    </WidgetComponentBoundaryWrapper>
  );
}

export default WidgetComponentBoundary;
