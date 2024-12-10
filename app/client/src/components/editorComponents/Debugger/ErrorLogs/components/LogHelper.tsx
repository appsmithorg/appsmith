import type { PluginErrorDetails } from "api/ActionAPI";
import { Button } from "@appsmith/ads";
import type { SourceEntity } from "entities/AppsmithConsole";
import type LOG_TYPE from "entities/AppsmithConsole/logtype";
import React, { useCallback, useMemo } from "react";
import styled from "styled-components";
import AnalyticsUtil from "ee/utils/AnalyticsUtil";
import ContextualMenu from "../../ContextualMenu";
import { useEventCallback } from "usehooks-ts";

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
  message?: string;
}) {
  // log telemetry on click of help icon.
  const addHelpTelemetry = useCallback(() => {
    AnalyticsUtil.logEvent("DEBUGGER_HELP_CLICK", {
      errorType: props.logType,
      errorSubType: props.name,
      appsmithErrorCode: props.pluginErrorDetails?.appsmithErrorCode,
      downstreamErrorCode: props.pluginErrorDetails?.downstreamErrorCode,
    });
  }, [
    props.logType,
    props.name,
    props.pluginErrorDetails?.appsmithErrorCode,
    props.pluginErrorDetails?.downstreamErrorCode,
  ]);

  const handleOnClick = useEventCallback((e: React.MouseEvent) => {
    addHelpTelemetry();
    e.stopPropagation();
  });

  const errorData = useMemo(
    () => ({
      message: {
        name: props.name || "",
        message: props.message || "",
      },
    }),
    [props.message, props.name],
  );

  return (
    <ContextWrapper onClick={handleOnClick}>
      <ContextualMenu entity={props.source} error={errorData}>
        <Button isIconButton kind="tertiary" size="sm" startIcon="question" />
      </ContextualMenu>
    </ContextWrapper>
  );
}
