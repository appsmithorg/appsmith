import React from "react";

import type { PluginErrorDetails } from "api/ActionAPI";
import AnalyticsUtil from "ee/utils/AnalyticsUtil";
import type { SourceEntity } from "entities/AppsmithConsole";
import type LOG_TYPE from "entities/AppsmithConsole/logtype";
import styled from "styled-components";

import { Button } from "@appsmith/ads";

import ContextualMenu from "../../ContextualMenu";

const ContextWrapper = styled.div`
  height: 14px;
  display: flex;
  align-items: center;
`;

export default function LogHelper(props: {
  logType?: LOG_TYPE;
  name?: string;
  pluginErrorDetails?: PluginErrorDetails;
  source?: SourceEntity;
}) {
  // log telemetry on click of help icon.
  const addHelpTelemetry = () => {
    AnalyticsUtil.logEvent("DEBUGGER_HELP_CLICK", {
      errorType: props.logType,
      errorSubType: props.name,
      appsmithErrorCode: props.pluginErrorDetails?.appsmithErrorCode,
      downstreamErrorCode: props.pluginErrorDetails?.downstreamErrorCode,
    });
  };
  return (
    <ContextWrapper
      onClick={(e) => {
        addHelpTelemetry();
        e.stopPropagation();
      }}
    >
      <ContextualMenu
        entity={props.source}
        error={{ message: { name: "", message: "" } }}
      >
        <Button isIconButton kind="tertiary" size="sm" startIcon="question" />
      </ContextualMenu>
    </ContextWrapper>
  );
}
