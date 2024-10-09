import React from "react";
import styled from "styled-components";
import { setDebuggerSelectedTab, showDebugger } from "actions/debuggerActions";
import { useDispatch, useSelector } from "react-redux";
import { getAppMode } from "ee/selectors/applicationSelectors";
import AnalyticsUtil from "ee/utils/AnalyticsUtil";
import { getTypographyByKey } from "@appsmith/ads-old";
import type { Message } from "entities/AppsmithConsole";
import ContextualMenu from "./ContextualMenu";
import { DEBUGGER_TAB_KEYS } from "./constants";
import type { FieldEntityInformation } from "../CodeEditor/EditorConfig";
import { Button } from "@appsmith/ads";

const EVDebugButton = styled(Button)`
  ${getTypographyByKey("btnSmall")};
  display: flex;
  width: fit-content;
  align-items: center;
  justify-content: center;
  cursor: pointer;
`;

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
        enableTooltip={false}
        entity={props.entity}
        error={props.error}
      >
        <EVDebugButton endIcon="down-arrow" kind="error" size="sm">
          Debug
        </EVDebugButton>
      </ContextualMenu>
    </Wrapper>
  );
}

const StyledButton = styled(Button)`
  && {
    width: fit-content;
    margin-top: 4px;
    text-transform: none;
    ${getTypographyByKey("p2")}
  }
`;

interface DebugCTAProps {
  className?: string;
  // For Analytics
  source?: string;
}

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
    dispatch(setDebuggerSelectedTab(DEBUGGER_TAB_KEYS.ERROR_TAB));
  };

  return <DebugButton className={props.className} onClick={onClick} />;
}

interface DebugButtonProps {
  className?: string;
  onClick: () => void;
}

export function DebugButton(props: DebugButtonProps) {
  return (
    <StyledButton
      className={props.className}
      kind="error"
      onClick={props.onClick}
      size="sm"
      startIcon="bug-line"
    >
      Debug
    </StyledButton>
  );
}

export default DebugCTA;
