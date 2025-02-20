import React from "react";
import PropertyPaneWrapper from "../../components/PropertyPaneWrapper";
import {
  ADD_PATH,
  BUILDER_CUSTOM_PATH,
  BUILDER_PATH,
  BUILDER_PATH_DEPRECATED,
  WIDGETS_EDITOR_BASE_PATH,
  WIDGETS_EDITOR_ID_PATH,
} from "constants/routes";
import { useRouteMatch } from "react-router";
import { SentryRoute } from "ee/AppRouter";

const RightPane = () => {
  const { path } = useRouteMatch();

  return (
    <SentryRoute
      component={PropertyPaneWrapper}
      exact
      path={[
        BUILDER_PATH_DEPRECATED,
        BUILDER_PATH,
        BUILDER_CUSTOM_PATH,
        `${path}${ADD_PATH}`,
        `${path}${WIDGETS_EDITOR_BASE_PATH}`,
        `${path}${WIDGETS_EDITOR_ID_PATH}`,
        `${path}${WIDGETS_EDITOR_ID_PATH}${ADD_PATH}`,
      ]}
    />
  );
};

export default RightPane;
