import React from "react";
import styled from "styled-components";
import { setDebuggerSelectedTab, showDebugger } from "actions/debuggerActions";
import { useDispatch, useSelector } from "react-redux";
import { getAppMode } from "@appsmith/selectors/applicationSelectors";
import AnalyticsUtil from "utils/AnalyticsUtil";
import {
  Button,
  Classes,
  getTypographyByKey,
  Icon,
  IconSize,
  Variant,
} from "design-system-old";
import type { Message } from "entities/AppsmithConsole";
import ContextualMenu from "./ContextualMenu";
import { Position } from "@blueprintjs/core";
import { DEBUGGER_TAB_KEYS } from "./helpers";
import { Colors } from "constants/Colors";
import type { FieldEntityInformation } from "../CodeEditor/EditorConfig";

const EVDebugButton = styled.button`
  ${getTypographyByKey("btnSmall")};
  display: flex;
  padding: ${(props) => props.theme.spaces[1]}px;
  border: 1px solid
    ${(props) => props.theme.colors.debugger.error.hoverIconColor};
  width: fit-content;
  background-color: transparent;
  color: ${(props) => props.theme.colors.debugger.error.hoverIconColor};
  align-items: center;
  justify-content: center;
  cursor: pointer;
  &:hover {
    background-color: ${(props) =>
      props.theme.colors.debugger.evalDebugButton.hover};
  }
  &:active {
    background-color: ${(props) =>
      props.theme.colors.debugger.evalDebugButton.active};
  }
  .${Classes.ICON} {
    margin-left: ${(props) => props.theme.spaces[1] + 1}px;
  }
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
        <EVDebugButton>
          DEBUG
          <Icon
            fillColor={Colors.POMEGRANATE2}
            hoverFillColor={Colors.POMEGRANATE2}
            name={"down-arrow"}
            size={IconSize.MEDIUM}
          />
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
    height: 26px;
    ${getTypographyByKey("p2")}
    .${Classes.ICON} {
      margin-right: 5px;
    }
    &:hover {
      .${Classes.ICON} {
        margin-right: 5px;
      }
    }
    svg,
    svg path {
      fill: ${Colors.WHITE};
    }
  }
`;

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
    dispatch(setDebuggerSelectedTab(DEBUGGER_TAB_KEYS.ERROR_TAB));
  };

  return <DebugButton className={props.className} onClick={onClick} />;
}

type DebugButtonProps = {
  className?: string;
  onClick: () => void;
};

export function DebugButton(props: DebugButtonProps) {
  return (
    <StyledButton
      className={props.className}
      icon="bug"
      onClick={props.onClick}
      tag="button"
      text="Debug"
      type="button"
      variant={Variant.danger}
    />
  );
}

export default DebugCTA;
