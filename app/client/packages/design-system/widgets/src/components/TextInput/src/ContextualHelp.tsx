import React from "react";

import { Tooltip } from "../../Tooltip";
import { IconButton } from "../../IconButton";
import type { TextInputProps } from "./TextInput";
import { QuestionMarkIcon } from "./icons/QuestionMarkIcon";

export type ContextualProps = TextInputProps;

const _ContextualHelp = (props: ContextualProps) => {
  const { contextualHelp } = props;

  return (
    <Tooltip tooltip={contextualHelp}>
      <IconButton color="neutral" variant="ghost">
        <QuestionMarkIcon />
      </IconButton>
    </Tooltip>
  );
};

export const ContextualHelp = _ContextualHelp;
