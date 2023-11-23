import React from "react";
import { Route, Switch } from "react-router-dom";
import { useRouteMatch } from "react-router";
import styled from "styled-components";
import CE_EditorRoutes from "ce/pages/Editor/routes";
import * as Sentry from "@sentry/react";
import { MODULE_INSTANCE_ID_PATH } from "@appsmith/constants/routes/eeAppRoutes";
import QueryModuleInstanceEditor from "@appsmith/pages/Editor/ModuleInstanceEditor/Query";

const SentryRoute = Sentry.withSentryRouting(Route);

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
  return (
    <Wrapper isVisible>
      <Switch key={path}>
        <CE_EditorRoutes />
        <SentryRoute
          component={QueryModuleInstanceEditor}
          exact
          path={`${path}${MODULE_INSTANCE_ID_PATH}`}
        />
      </Switch>
    </Wrapper>
  );
}

export default EditorsRouter;
