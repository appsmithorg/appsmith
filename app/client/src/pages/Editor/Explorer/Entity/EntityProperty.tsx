import type { MutableRefObject } from "react";
import React, { memo, useCallback, useRef } from "react";
import styled from "styled-components";
import HighlightedCode, {
  SYNTAX_HIGHLIGHTING_SUPPORTED_LANGUAGES,
} from "components/editorComponents/HighlightedCode";
import { Collapse } from "@blueprintjs/core";
import { CurrentValueViewer } from "components/editorComponents/CodeEditor/EvaluatedValuePopup";
import { EditorTheme } from "components/editorComponents/CodeEditor/EditorConfig";
import useClipboard from "utils/hooks/useClipboard";
import { Skin } from "constants/DefaultTheme";
import { EntityClassNames } from ".";
import { Tooltip, Icon } from "@appsmith/ads";
import { COPY_ELEMENT, createMessage } from "ee/constants/messages";
import CollapseToggle from "./CollapseToggle";
import AnalyticsUtil from "ee/utils/AnalyticsUtil";
import type { EntityProperty as EntityPropertyType } from "ee/pages/Editor/Explorer/Entity/getEntityProperties";

const Wrapper = styled.div`
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
      /* color: white; */
      display: flex;
      justify-content: center;
      align-items: center;
      text-align: center;
      z-index: 2;
      border-radius: var(--ads-v2-border-radius);
      &.success {
        background: var(--ads-v2-color-bg-success);
      }
      &.error {
        background: var(--ads-v2-color-bg-error);
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
        padding-left: ${(props) => props.theme.spaces[3]}px;
        padding-right: 20px;
        & span.token.property {
          overflow: hidden;
          white-space: nowrap;
          text-overflow: ellipsis;
        }
      }
    }

    .type-text {
      font-size: 12px;
    }
  }
`;

const CopyBox = styled.div`
  cursor: pointer;
  position: relative;
  padding: 0 8px;
  .copy-icon {
    /* margin-right: 5px; */
    opacity: 0;
  }
  &:hover {
    &:before {
      content: "";
      background: var(--ads-v2-color-bg-subtle);
      opacity: 1;
      position: absolute;
      left: 0;
      height: 100%;
      top: 0;
      width: 100%;
      z-index: -1;
      border-radius: var(--ads-v2-border-radius);
    }
    .copy-icon {
      opacity: 1;
    }
  }
`;

const StyledHighlightedCode = styled(HighlightedCode)`
  padding-top: 4px;
  padding-bottom: 4px;
`;

export interface EntityPropertyProps extends EntityPropertyType {
  index: number;
}

export const EntityProperty = memo((props: EntityPropertyProps) => {
  const propertyRef: MutableRefObject<HTMLDivElement | null> = useRef(null);
  const write = useClipboard(propertyRef);

  const [isOpen, setIsOpen] = React.useState(props.index === 0);

  const codeText = `{{${props.entityName}.${props.propertyName}}}`;

  const isString = typeof props.value === "string";

  const copyBindingToClipboard = () => {
    AnalyticsUtil.logEvent("BINDING_COPIED", {
      entityType: props.entityType,
      codeText,
    });
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
    <Wrapper className={`${EntityClassNames.PROPERTY}`}>
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
          <Tooltip content={createMessage(COPY_ELEMENT)} placement="right">
            <Icon
              className="copy-icon"
              name="duplicate"
              onClick={copyBindingToClipboard}
              size="md"
            />
          </Tooltip>
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
