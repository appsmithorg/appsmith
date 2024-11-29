import type { Message, SourceEntity } from "entities/AppsmithConsole";
import React, { useCallback } from "react";
import type LOG_TYPE from "entities/AppsmithConsole/logtype";
import type { Plugin } from "api/PluginApi";
import { Link } from "@appsmith/ads";
import type { ENTITY_TYPE } from "ee/entities/AppsmithConsole/utils";
import styled from "styled-components";
import { getTypographyByKey } from "@appsmith/ads-old";

export enum DebuggerLinkUI {
  ENTITY_TYPE,
  ENTITY_NAME,
}

const Wrapper = styled.div`
  .debugger-entity-link {
    // TODO: unclear why this file and LogItem.tsx have different styles when they look so similar
    ${getTypographyByKey("h6")}
    font-weight: 400;
    letter-spacing: -0.195px;
    color: var(--ads-v2-color-fg-emphasis);
    cursor: pointer;
    text-decoration-line: underline;
    flex-shrink: 0;
    width: max-content;

    > span {
      font-size: 12px;
    }
  }
`;

export type EntityLinkProps = {
  uiComponent: DebuggerLinkUI;
  plugin?: Plugin;
  errorType?: LOG_TYPE;
  errorSubType?: string;
  appsmithErrorCode?: string;
  message?: Message;
} & SourceEntity;

export function DebuggerEntityLink(props: {
  name: string;
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onClick: any;
  entityType: ENTITY_TYPE;
  uiComponent: DebuggerLinkUI;
}) {
  const handleClick = useCallback(
    (e) => {
      e.stopPropagation();
      props.onClick();
    },
    [props.onClick],
  );

  switch (props.uiComponent) {
    case DebuggerLinkUI.ENTITY_TYPE:
      return (
        <span className="debugger-entity">
          [
          <Link kind="secondary" onClick={handleClick}>
            {props.name}
          </Link>
          ]
        </span>
      );
    case DebuggerLinkUI.ENTITY_NAME:
      return (
        <Wrapper>
          <Link
            className="debugger-entity-link t--debugger-log-entity-link"
            onClick={handleClick}
          >
            {props.name}:
          </Link>
        </Wrapper>
      );
    default:
      return null;
  }
}
