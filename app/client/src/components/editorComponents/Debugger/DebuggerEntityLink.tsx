import React from "react";
import type { Message, SourceEntity } from "entities/AppsmithConsole";
import type LOG_TYPE from "entities/AppsmithConsole/logtype";
import type { Plugin } from "api/PluginApi";
import { Link } from "@appsmith/ads";
import type { ENTITY_TYPE } from "ee/entities/AppsmithConsole/utils";
import styled from "styled-components";
import { getTypographyByKey } from "@appsmith/ads-old";
import { useEventCallback } from "usehooks-ts";

export enum DebuggerLinkUI {
  ENTITY_TYPE,
  ENTITY_NAME,
}

const EntityNameLink = styled(Link)`
  ${getTypographyByKey("h6")}
  letter-spacing: -0.195px;
  color: var(--ads-v2-color-fg-emphasis);
  cursor: pointer;
  text-decoration-line: underline;
  flex-shrink: 0;
  width: max-content;

  > span {
    ${getTypographyByKey("h6")}
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
  onClick: () => void;
  entityType: ENTITY_TYPE;
  uiComponent: DebuggerLinkUI;
}) {
  const { onClick } = props;

  const handleClick = useEventCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onClick();
  });

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
        <EntityNameLink
          className="t--debugger-log-entity-link"
          onClick={handleClick}
        >
          {props.name}
        </EntityNameLink>
      );
    default:
      return null;
  }
}
