import React from "react";

import * as Styled from "./EntityTabsHeader.styles";

import type {
  EntityTabsHeaderProps,
  EntityListButtonProps,
} from "./EntityTabsHeader.types";

import { ToggleButton } from "../..";

export const EntityListButton = (props: EntityListButtonProps) => {
  return <ToggleButton {...props} icon="hamburger" size="md" />;
};

export function EntityTabsHeader({ children }: EntityTabsHeaderProps) {
  return <Styled.Root>{children}</Styled.Root>;
}
