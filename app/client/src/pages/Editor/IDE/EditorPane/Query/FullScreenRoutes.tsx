import React from "react";
import { Switch, useRouteMatch } from "react-router";
import { SentryRoute } from "@appsmith/AppRouter";
import { ADD_PATH } from "@appsmith/constants/routes/appRoutes";
import AddQuery from "./Add";
import ListQuery from "./List";

const FullScreenRoutes = () => {
  const { path } = useRouteMatch();
  return (
    <Switch>
      <SentryRoute
        component={AddQuery}
        exact
        path={[`${path}${ADD_PATH}`, `${path}/:queryId${ADD_PATH}`]}
      />
      <SentryRoute component={ListQuery} />
    </Switch>
  );
};

export default FullScreenRoutes;
