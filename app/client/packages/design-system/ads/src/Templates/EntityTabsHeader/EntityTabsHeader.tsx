import React from "react";

import * as Styled from "./EntityTabsHeader.styles";

import type {
  EntityTabsHeaderProps,
  EntityListButtonProps,
  ToggleScreenModeButtonProps,
} from "./EntityTabsHeader.types";

import { ToggleButton } from "../../ToggleButton";
import { type DismissibleTabBarProps } from "../../DismissibleTab/DismissibleTabBar.types";

export const EntityListButton = (props: EntityListButtonProps) => {
  return <ToggleButton {...props} icon="hamburger" size="md" />;
};

export const ToggleScreenModeButton = (props: ToggleScreenModeButtonProps) => {
  const { isInSplitScreenMode, ...rest } = props;
  const iconName = isInSplitScreenMode ? "maximize-v3" : "minimize-v3";

  return (
    <Styled.IconButton
      {...rest}
      isIconButton
      kind="tertiary"
      startIcon={iconName}
    />
  );
};

export const EntityTabBar = (props: DismissibleTabBarProps) => {
  return <Styled.TabBar {...props} />;
};

export function EntityTabsHeader({ children }: EntityTabsHeaderProps) {
  return <Styled.Root>{children}</Styled.Root>;
}
