import React from "react";
import styled from "styled-components";
import Button from "components/ads/Button";
import { showDebugger } from "actions/debuggerActions";
import { useDispatch, useSelector } from "react-redux";
import { Classes, Variant } from "components/ads/common";
import { getAppMode } from "selectors/applicationSelectors";
import AnalyticsUtil from "utils/AnalyticsUtil";
import { getTypographyByKey } from "constants/DefaultTheme";
import Icon, { IconSize } from "components/ads/Icon";
import { Message } from "entities/AppsmithConsole";
import ContextualMenu from "./ContextualMenu";
import { Position } from "@blueprintjs/core";

const EVDebugButton = styled.button`
  font-size: 11px;
  font-weight: 600;
  display: flex;
  padding: 4px;
  line-height: 13px;
  border: 1px solid #f22b2b;
  width: fit-content;
  background-color: transparent;
  color: #f22b2b;
  align-items: center;
  justify-content: center;
  cursor: pointer;

  &:hover {
    background-color: #fafafaaa;
  }

  &:active {
    background-color: #fafafaff;
  }

  .${Classes.ICON} {
    margin-left: 5px;
  }
`;

const Wrapper = styled.div`
  display: flex;
  justify-content: flex-end;
  cursor: pointer;
  margin-top: 6px;
`;

export function EvaluatedValueDebugButton(props: { error: Message }) {
  return (
    <Wrapper>
      <ContextualMenu
        error={props.error}
        modifiers={{
          offset: {
            offset: "0, 0",
          },
        }}
        position={Position.BOTTOM_RIGHT}
      >
        <EVDebugButton>
          DEBUG
          <Icon
            fillColor={"#F22B2B"}
            hoverFillColor={"#F22B2B"}
            name={"downArrow"}
            size={IconSize.XXS}
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
  ${(props) => getTypographyByKey(props, "p2")}
  .${Classes.ICON} {
    margin-right: 5px;
  }
  &:hover {
    .${Classes.ICON} {
      margin-right: 5px;
    }
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
      variant={Variant.danger}
    />
  );
}

export default DebugCTA;
