import React, { memo, MutableRefObject, useRef } from "react";
import styled from "styled-components";
import HighlightedCode, {
  SYNTAX_HIGHLIGHTING_SUPPORTED_LANGUAGES,
} from "components/editorComponents/HighlightedCode";
import {
  Classes,
  Icon,
  Popover,
  PopoverInteractionKind,
  Position,
} from "@blueprintjs/core";
import { CurrentValueViewer } from "components/editorComponents/CodeEditor/EvaluatedValuePopup";
import { EditorTheme } from "components/editorComponents/CodeEditor/EditorConfig";
import useClipboard from "utils/hooks/useClipboard";
import { Colors } from "constants/Colors";
import { Skin } from "constants/DefaultTheme";
import { ControlIcons } from "icons/ControlIcons";

import { ContextMenuPopoverModifiers } from "../helpers";
import { EntityClassNames } from ".";
import ScrollIndicator from "components/ads/ScrollIndicator";
import TooltipComponent from "components/ads/Tooltip";
import { COPY_ELEMENT, createMessage } from "constants/messages";
import { TOOLTIP_HOVER_ON_DELAY } from "constants/AppConstants";

const StyledValue = styled.pre<{ step: number }>`
  & {
    display: inline;
    font-size: 10px;
    line-height: 12px;
    color: ${Colors.GRAY_CHATEAU};
    padding-left: ${(props) =>
      props.step * props.theme.spaces[2] + props.theme.spaces[3]}px;
    margin: 0;
  }
`;

const Wrapper = styled.div<{ step: number }>`
  &&&& {
    margin: ${(props) => props.theme.spaces[2]}px 0;

    position: relative;
    code {
      border: none;
      box-shadow: none;
      padding: 5px 0em;
      background: none;
    }
    & div.clipboard-message {
      position: absolute;
      left: 0;
      height: 100%;
      top: 0;
      width: 100%;
      font-size: 12px;
      color: white;
      display: flex;
      justify-content: center;
      align-items: center;
      text-align: center;
      z-index: 1;
      &.success {
        background: ${Colors.TUNDORA};
      }
      &.error {
        background: ${Colors.RED};
      }
    }

    & {
      code.${SYNTAX_HIGHLIGHTING_SUPPORTED_LANGUAGES.APPSMITH} {
        display: flex;
        white-space: pre-wrap;
        background: transparent;
        font-size: 11px;
        overflow-wrap: break-word;
        text-shadow: none;
        padding-left: ${(props) =>
          props.step * props.theme.spaces[2] + props.theme.spaces[3]}px;
        padding-right: 20px;
        & span.token.property {
          overflow: hidden;
          white-space: nowrap;
          text-overflow: ellipsis;
        }
      }
    }

    & .${Classes.POPOVER_WRAPPER} {
      display: inline;
      vertical-align: middle;
      margin-left: 4px;
      cursor: pointer;
    }
    & .${Classes.POPOVER_TARGET} {
      display: inline;
    }
  }
`;

const StyledPopoverContent = styled.div`
  background: ${Colors.WHITE};
  max-height: 500px;
  width: 400px;
  padding: 10px;
  overflow: auto;
  & > div {
    max-height: 100%;
    & > pre {
      overflow: hidden;
    }
  }
  & > pre {
    width: 100%;
    overflow: hidden;
    white-space: pre-wrap;
    color: white;
  }
`;

const CopyBox = styled.div`
  cursor: pointer;
  position: relative;
  .${Classes.POPOVER_WRAPPER} {
    position: absolute;
    right: 4px;
    top: 8px;
    opacity: 0;
    z-index: 2;
    fill: ${Colors.TUNDORA};
    &:hover {
      opacity: 1;
    }
  }
  &:hover {
    &:before {
      content: "";
      background: ${Colors.Gallery};
      opacity: 1;
      position: absolute;
      left: 0;
      height: 100%;
      top: 0;
      width: 100%;
      z-index: -1;
    }
    .${Classes.POPOVER_WRAPPER} {
      opacity: 1;
    }
  }
`;

const StyledHighlightedCode = styled(HighlightedCode)`
  padding-top: 4px;
  padding-bottom: 4px;
`;

const CollapseIcon = ControlIcons.COLLAPSE_CONTROL;
const collapseIcon = <CollapseIcon color={Colors.ALTO} height={8} width={10} />;

export type EntityPropertyProps = {
  propertyName: string;
  entityName: string;
  value: string;
  step: number;
};

const transformedValue = (value: any) => {
  if (
    typeof value === "object" ||
    Array.isArray(value) ||
    (value && value.length && value.length > 30)
  ) {
    return JSON.stringify(value).slice(0, 25) + "...";
  }
  return `${value}`;
};

/* eslint-disable react/display-name */
export const EntityProperty = memo((props: EntityPropertyProps) => {
  const propertyRef: MutableRefObject<HTMLDivElement | null> = useRef(null);
  const write = useClipboard(propertyRef);
  const popoverContentRef = React.createRef<HTMLDivElement>();

  const codeText = `{{${props.entityName}.${props.propertyName}}}`;

  const showPopup =
    typeof props.value === "object" ||
    Array.isArray(props.value) ||
    (props.value && props.value.length && props.value.length > 25);
  const isString = typeof props.value === "string";

  const copyBindingToClipboard = () => {
    write(codeText);
  };

  let propertyValue = (
    <StyledValue className="value" step={props.step}>
      {transformedValue(props.value)}
    </StyledValue>
  );
  if (showPopup) {
    propertyValue = (
      <>
        <StyledValue className="value" step={props.step}>
          {transformedValue(props.value)}
        </StyledValue>
        <Popover
          interactionKind={PopoverInteractionKind.HOVER}
          modifiers={ContextMenuPopoverModifiers}
          position="left"
        >
          {collapseIcon}
          {showPopup && (
            <StyledPopoverContent ref={popoverContentRef}>
              {!isString && (
                <CurrentValueViewer
                  evaluatedValue={props.value}
                  hideLabel
                  theme={EditorTheme.LIGHT}
                />
              )}
              {isString && <pre>{props.value}</pre>}
              <ScrollIndicator containerRef={popoverContentRef} mode="DARK" />
            </StyledPopoverContent>
          )}
        </Popover>
      </>
    );
  }

  return (
    <Wrapper className={`${EntityClassNames.PROPERTY}`} step={props.step}>
      <CopyBox>
        <StyledHighlightedCode
          className="binding"
          codeText={codeText}
          language={SYNTAX_HIGHLIGHTING_SUPPORTED_LANGUAGES.APPSMITH}
          onClick={copyBindingToClipboard}
          ref={propertyRef}
          skin={Skin.DARK}
        />
        <TooltipComponent
          boundary="viewport"
          content={createMessage(COPY_ELEMENT)}
          hoverOpenDelay={TOOLTIP_HOVER_ON_DELAY}
          position={Position.RIGHT}
        >
          <Icon
            color={Colors.ALTO}
            icon="duplicate"
            iconSize={14}
            onClick={copyBindingToClipboard}
          />
        </TooltipComponent>
      </CopyBox>
      {propertyValue}
    </Wrapper>
  );
});

export default EntityProperty;
