import type { PluginErrorDetails } from "api/ActionAPI";
import {
  createMessage,
  TROUBLESHOOT_ISSUE,
} from "@appsmith/constants/messages";
import {
  AppIcon,
  Classes,
  IconSize,
  Text,
  TextType,
  TooltipComponent,
} from "design-system-old";
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

const StyledSearchIcon = styled(AppIcon)`
  height: 16px;
  width: 16px;
  svg {
    height: 16px;
    width: 16px;
  }
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
        <TooltipComponent
          content={
            <Text style={{ color: "#ffffff" }} type={TextType.P3}>
              {createMessage(TROUBLESHOOT_ISSUE)}
            </Text>
          }
          minimal
          position="bottom-right"
        >
          <StyledSearchIcon
            className={`${Classes.ICON}`}
            name={"help"}
            size={IconSize.SMALL}
          />
        </TooltipComponent>
      </ContextualMenu>
    </ContextWrapper>
  );
}
