import React, { memo, MutableRefObject, useCallback, useRef } from "react";
import styled from "styled-components";
import HighlightedCode, {
  SYNTAX_HIGHLIGHTING_SUPPORTED_LANGUAGES,
} from "components/editorComponents/HighlightedCode";
import { Classes, Collapse, Position } from "@blueprintjs/core";
import { CurrentValueViewer } from "components/editorComponents/CodeEditor/EvaluatedValuePopup";
import { EditorTheme } from "components/editorComponents/CodeEditor/EditorConfig";
import useClipboard from "utils/hooks/useClipboard";
import { Colors } from "constants/Colors";
import { Skin } from "constants/DefaultTheme";
import { EntityClassNames } from ".";
import TooltipComponent from "components/ads/Tooltip";
import { COPY_ELEMENT, createMessage } from "@appsmith/constants/messages";
import { TOOLTIP_HOVER_ON_DELAY } from "constants/AppConstants";
import CollapseToggle from "./CollapseToggle";
import { ReactComponent as CopyIcon } from "assets/icons/menu/copy-snippet.svg";

const Wrapper = styled.div<{ step: number }>`
  &&&& {
    padding: ${(props) => props.theme.spaces[0]}px;

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
      z-index: 2;
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
        white-space: nowrap;
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
          color: rgb(221, 74, 104) !important;
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
    .type-text {
      font-size: 12px;
      color: #716e6e;
    }
  }
`;

const CopyBox = styled.div`
  cursor: pointer;
  position: relative;
  padding: 0 8px;
  .${Classes.POPOVER_WRAPPER} {
    position: absolute;
    opacity: 0;
    z-index: 2;
    right: 12px;
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

export type EntityPropertyProps = {
  propertyName: string;
  entityName: string;
  value: string;
  step?: number;
};

/* eslint-disable react/display-name */
export const EntityProperty = memo((props: any) => {
  const propertyRef: MutableRefObject<HTMLDivElement | null> = useRef(null);
  const write = useClipboard(propertyRef);
  // const popoverContentRef = React.createRef<HTMLDivElement>();
  const [isOpen, setIsOpen] = React.useState(false);

  const codeText = `{{${props.entityName}.${props.propertyName}}}`;

  const isString = typeof props.value === "string";

  const copyBindingToClipboard = () => {
    write(codeText);
  };

  const toggleChildren = useCallback(
    (e) => {
      e.stopPropagation();
      setIsOpen(!isOpen);
    },
    [isOpen],
  );

  return (
    <Wrapper className={`${EntityClassNames.PROPERTY}`} step={props.step}>
      <CopyBox>
        <div className="flex flex-grow items-center">
          <CollapseToggle
            className={`${EntityClassNames.COLLAPSE_TOGGLE}`}
            disabled={false}
            isOpen={isOpen}
            isVisible
            onClick={toggleChildren}
          />
          <StyledHighlightedCode
            className="binding flex-1"
            codeText={codeText}
            language={SYNTAX_HIGHLIGHTING_SUPPORTED_LANGUAGES.APPSMITH}
            onClick={copyBindingToClipboard}
            ref={propertyRef}
            skin={Skin.LIGHT}
          />
          <TooltipComponent
            boundary="viewport"
            content={createMessage(COPY_ELEMENT)}
            hoverOpenDelay={TOOLTIP_HOVER_ON_DELAY}
            position={Position.RIGHT}
          >
            <CopyIcon onClick={copyBindingToClipboard} />
          </TooltipComponent>
        </div>
      </CopyBox>
      <Collapse className="px-4" isOpen={isOpen}>
        {isString ? (
          <span className="type-text">{props.value}</span>
        ) : (
          <CurrentValueViewer
            evaluatedValue={props.value}
            hideLabel
            theme={EditorTheme.LIGHT}
          />
        )}
      </Collapse>
    </Wrapper>
  );
});

export default EntityProperty;
