import React from "react";

import { Tooltip } from "../../Tooltip";
import { IconButton } from "../../IconButton";
import type { TextInputProps } from "./TextInput";
import { QuestionMarkIcon } from "./icons/QuestionMarkIcon";

export type ContextualProps = TextInputProps;

const _ContextualHelp = (props: ContextualProps) => {
  const { contextualHelp } = props;

  return (
    <Tooltip interaction="click" tooltip={contextualHelp}>
      <IconButton color="neutral" size="small" variant="ghost">
        <QuestionMarkIcon />
      </IconButton>
    </Tooltip>
  );
};

export const ContextualHelp = _ContextualHelp;
