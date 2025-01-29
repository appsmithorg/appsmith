import React from "react";

import * as Styled from "./EntityTabsHeader.styles";

import type {
  EntityTabsHeaderProps,
  EntityListButtonProps,
  ToggleScreenModeButtonProps,
} from "./EntityTabsHeader.types";

import { ToggleButton } from "../..";

export const EntityListButton = (props: EntityListButtonProps) => {
  return <ToggleButton {...props} icon="hamburger" size="md" />;
};

export const ToggleScreenModeButton = (props: ToggleScreenModeButtonProps) => {
  return (
    <Styled.IconButton
      {...props}
      isIconButton
      kind="tertiary"
      startIcon="maximize-v3"
    />
  );
};

export function EntityTabsHeader({ children }: EntityTabsHeaderProps) {
  return <Styled.Root>{children}</Styled.Root>;
}
