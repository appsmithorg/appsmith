import React from "react";
import { createMessage, SNIPPET_TOOLTIP } from "ee/constants/messages";
import { Button, Tooltip } from "@appsmith/ads";

export enum ENTITY_TYPE {
  ACTION = "ACTION",
  WIDGET = "WIDGET",
  APPSMITH = "APPSMITH",
  JSACTION = "JSACTION",
}

interface Props {
  className?: string;
  entityId?: string;
  entityType: ENTITY_TYPE;
  // TODO: be more precise with the function type
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onClick: any;
  showIconOnly?: boolean;
}

export default function SearchSnippets(props: Props) {
  const className = props.className || "";
  const handleClick = props.onClick;

  return props.showIconOnly ? (
    <Button
      isIconButton
      kind="tertiary"
      onClick={handleClick}
      size="md"
      startIcon="snippet"
    />
  ) : (
    <Tooltip content={createMessage(SNIPPET_TOOLTIP)} placement="bottomRight">
      <Button
        className={`t--search-snippets ${className}`}
        kind="secondary"
        onClick={handleClick}
        size="md"
        startIcon="snippet"
      >
        Snippets
      </Button>
    </Tooltip>
  );
}
