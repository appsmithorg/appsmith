import React from "react";
import { Switch, useRouteMatch } from "react-router";
import { SentryRoute } from "@appsmith/AppRouter";
import {
  ADD_PATH,
  API_EDITOR_ID_PATH,
  BUILDER_CUSTOM_PATH,
  BUILDER_PATH,
  BUILDER_PATH_DEPRECATED,
} from "@appsmith/constants/routes/appRoutes";
import AddQuery from "./Add";
import ListQuery from "./List";
import QueryEditor from "pages/Editor/QueryEditor";
import ApiEditor from "pages/Editor/APIEditor";

const SplitScreenRoutes = () => {
  const { path } = useRouteMatch();
  return (
    <Switch>
      <SentryRoute
        component={AddQuery}
        exact
        path={[`${path}${ADD_PATH}`, `${path}/:queryId${ADD_PATH}`]}
      />
      <SentryRoute
        component={QueryEditor}
        exact
        path={[
          path + "/api/:apiId", // SAAS path
          path + "/:queryId",
        ]}
      />
      <SentryRoute
        component={ApiEditor}
        exact
        path={[
          BUILDER_PATH + API_EDITOR_ID_PATH,
          BUILDER_CUSTOM_PATH + API_EDITOR_ID_PATH,
          BUILDER_PATH_DEPRECATED + API_EDITOR_ID_PATH,
        ]}
      />
      <SentryRoute component={ListQuery} />
    </Switch>
  );
};

export default SplitScreenRoutes;
