import React from "react";
import { MenuItem } from "@appsmith/ads";

interface Props {
  disabled?: boolean;
}

export const Rename = ({ disabled }: Props) => {
  return (
    <MenuItem disabled={disabled} startIcon="input-cursor-move">
      Rename
    </MenuItem>
  );
};
