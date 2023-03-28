import React from "react";
import styled from "styled-components";
import {
  setCanvasDebuggerSelectedTab,
  showDebugger,
} from "actions/debuggerActions";
import { useDispatch, useSelector } from "react-redux";
import { getAppMode } from "selectors/applicationSelectors";
import AnalyticsUtil from "utils/AnalyticsUtil";
import { Button } from "design-system";
import type { Message } from "entities/AppsmithConsole";
import ContextualMenu from "./ContextualMenu";
import { Position } from "@blueprintjs/core";
import { DEBUGGER_TAB_KEYS } from "./helpers";
import type { FieldEntityInformation } from "../CodeEditor/EditorConfig";

const Wrapper = styled.div`
  display: flex;
  justify-content: flex-end;
  cursor: pointer;
  margin-top: 6px;
`;

export function EvaluatedValueDebugButton(props: {
  error: Message;
  entity?: FieldEntityInformation;
}) {
  return (
    <Wrapper>
      <ContextualMenu
        entity={props.entity}
        error={props.error}
        modifiers={{
          offset: {
            enabled: true,
            options: {
              offset: [0, 5],
            },
          },
          arrow: {
            enabled: false,
          },
        }}
        position={Position.BOTTOM_RIGHT}
      >
        <Button kind="secondary" size="sm" startIcon="down-arrow">
          DEBUG
        </Button>
      </ContextualMenu>
    </Wrapper>
  );
}

type DebugCTAProps = {
  className?: string;
  // For Analytics
  source?: string;
};

function DebugCTA(props: DebugCTAProps) {
  const dispatch = useDispatch();
  const appMode = useSelector(getAppMode);

  if (appMode === "PUBLISHED") return null;

  const onClick = () => {
    props.source &&
      AnalyticsUtil.logEvent("OPEN_DEBUGGER", {
        source: props.source,
      });
    dispatch(showDebugger(true));
    dispatch(setCanvasDebuggerSelectedTab(DEBUGGER_TAB_KEYS.ERROR_TAB));
  };

  return <DebugButton className={props.className} onClick={onClick} />;
}

type DebugButtonProps = {
  className?: string;
  onClick: () => void;
};

export function DebugButton(props: DebugButtonProps) {
  return (
    <Button
      className={props.className}
      endIcon="bug"
      kind="error"
      onClick={props.onClick}
    >
      Debug
    </Button>
  );
}

export default DebugCTA;
