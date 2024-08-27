import React from "react";
import IntegrationsHomeScreen from "./IntegrationsHomeScreen";
import type { RouteComponentProps } from "react-router";
import * as Sentry from "@sentry/react";

type Props = RouteComponentProps<{
  basePageId: string;
  selectedTab: string;
}>;

const integrationsEditor = (props: Props) => {
  const { history, location, match } = props;

  return (
    <div
      style={{
        position: "relative",
        height: "100%",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <IntegrationsHomeScreen
        basePageId={match.params.basePageId}
        history={history}
        location={location}
        selectedTab={match.params.selectedTab}
      />
    </div>
  );
};

export default Sentry.withProfiler(integrationsEditor);
