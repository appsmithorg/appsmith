import type { Message, SourceEntity } from "entities/AppsmithConsole";
import React, { useCallback } from "react";
import type LOG_TYPE from "entities/AppsmithConsole/logtype";
import type { Plugin } from "api/PluginApi";
import { Link } from "@appsmith/ads";
import type { ENTITY_TYPE } from "ee/entities/AppsmithConsole/utils";

export enum DebuggerLinkUI {
  ENTITY_TYPE,
  ENTITY_NAME,
}

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
        <Link
          className="debugger-entity-link t--debugger-log-entity-link"
          onClick={handleClick}
        >
          {props.name}
        </Link>
      );
    default:
      return null;
  }
}
