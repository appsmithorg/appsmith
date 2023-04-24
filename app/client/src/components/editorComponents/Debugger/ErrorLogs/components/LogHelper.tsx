import type { PluginErrorDetails } from "api/ActionAPI";
import { createMessage, TROUBLESHOOT_ISSUE } from "ce/constants/messages";
import { Icon, Tooltip } from "design-system";
import type { SourceEntity } from "entities/AppsmithConsole";
import type LOG_TYPE from "entities/AppsmithConsole/logtype";
import React from "react";
import styled from "styled-components";
import AnalyticsUtil from "utils/AnalyticsUtil";
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
        <Tooltip content={createMessage(TROUBLESHOOT_ISSUE)} placement="bottom">
          <Icon name="question" size="md" />
        </Tooltip>
      </ContextualMenu>
    </ContextWrapper>
  );
}
