import React, { useEffect } from "react";
import { Switch } from "react-router-dom";
import { useLocation, useRouteMatch } from "react-router";
import styled from "styled-components";
import PerformanceTracker, {
  PerformanceTransactionName,
} from "utils/PerformanceTracker";
import CE_EditorRoutes from "ce/pages/Editor/routes";

const Wrapper = styled.div<{ isVisible: boolean }>`
  position: absolute;
  top: 0;
  left: 0;
  width: ${(props) => (!props.isVisible ? "0px" : "100%")};
  height: 100%;
  background-color: ${(props) => (props.isVisible ? "white" : "transparent")};
  z-index: ${(props) => (props.isVisible ? 2 : -1)};
  width: ${(props) => (!props.isVisible ? "0" : "100%")};
  display: flex;
  flex-direction: column;
`;

function EditorsRouter() {
  const { path } = useRouteMatch();
  const { pathname } = useLocation();

  useEffect(() => {
    return () => {
      PerformanceTracker.startTracking(
        PerformanceTransactionName.CLOSE_SIDE_PANE,
        { path: pathname },
      );
    };
  });

  return (
    <Wrapper isVisible>
      <Switch key={path}>
        <CE_EditorRoutes />
      </Switch>
    </Wrapper>
  );
}

export default EditorsRouter;
