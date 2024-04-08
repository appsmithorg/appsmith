import React from "react";

import { Tooltip } from "../../Tooltip";
import { IconButton } from "../../IconButton";
import type { TextInputProps } from "./TextInput";

export type ContextualProps = TextInputProps;

const _ContextualHelp = (props: ContextualProps) => {
  const { contextualHelp } = props;

  return (
    <Tooltip interaction="click" tooltip={contextualHelp}>
      <IconButton
        color="neutral"
        icon="question-mark"
        size="small"
        variant="ghost"
      />
    </Tooltip>
  );
};

export const ContextualHelp = _ContextualHelp;
