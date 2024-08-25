import React from "react";
import WidgetPropertyPane from "../../../PropertyPane";
import classNames from "classnames";
import { Switch } from "react-router-dom";
import { SentryRoute } from "ee/AppRouter";
import {
  ADD_PATH,
  BUILDER_CUSTOM_PATH,
  BUILDER_PATH,
  BUILDER_PATH_DEPRECATED,
  WIDGETS_EDITOR_ID_PATH,
} from "ee/constants/routes/appRoutes";
import AddWidgets from "./Add";
import { useRouteMatch } from "react-router";

const Editor = () => {
  const { path } = useRouteMatch();
  return (
    <div
      className={classNames({
        "h-full p-0 overflow-y-auto": true,
      })}
    >
      <Switch>
        <SentryRoute
          component={AddWidgets}
          exact
          path={[
            BUILDER_CUSTOM_PATH,
            BUILDER_PATH,
            BUILDER_PATH_DEPRECATED,
            `${path}${ADD_PATH}`,
          ]}
        />
        <SentryRoute
          component={WidgetPropertyPane}
          exact
          path={[`${path}${WIDGETS_EDITOR_ID_PATH}`]}
        />
      </Switch>
    </div>
  );
};

export default Editor;
