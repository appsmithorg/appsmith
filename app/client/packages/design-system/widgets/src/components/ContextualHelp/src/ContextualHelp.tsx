import React from "react";
import { Tooltip, IconButton } from "@appsmith/wds";

import type { ContextualProps } from "./types";

const _ContextualHelp = (props: ContextualProps) => {
  const { contextualHelp } = props;

  if (!Boolean(contextualHelp)) return null;

  return (
    <Tooltip interaction="click" tooltip={contextualHelp}>
      <IconButton
        color="neutral"
        icon="question-mark"
        size="small"
        slot={null}
        variant="ghost"
      />
    </Tooltip>
  );
};

export const ContextualHelp = _ContextualHelp;
