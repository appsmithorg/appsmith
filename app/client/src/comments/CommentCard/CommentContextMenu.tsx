import React from "react";
import Icon, { IconSize } from "components/ads/Icon";
import { Theme } from "constants/DefaultTheme";
import { withTheme } from "styled-components";
import { Popover } from "@blueprintjs/core";

// WIP: Implement context menu
const Menu = () => <div>Comment context menu</div>;

const CommentContextMenu = ({ theme }: { theme: Theme }) => (
  <Popover minimal boundary="viewport" popoverClassName="comment-thread">
    <Icon
      name="card-context-menu"
      fillColor={theme.colors.comments.profileUserName}
      size={IconSize.LARGE}
    />
    <Menu />
  </Popover>
);

export default withTheme(CommentContextMenu);
