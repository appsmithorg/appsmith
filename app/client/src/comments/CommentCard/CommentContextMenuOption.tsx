import React, { useCallback } from "react";
import Icon, { IconSize, IconName } from "components/ads/Icon";
import styled from "styled-components";
import { noop } from "lodash";

const MenuItem = styled.div`
  display: flex;
  width: 180px;
  cursor: pointer;
  &:hover {
    background-color: ${(props) =>
      props.theme.colors.comments.contextMenuItemHover};
  }
`;

const MenuIcon = styled.div`
  padding: ${(props) =>
    `${props.theme.spaces[4]}px ${props.theme.spaces[5]}px`};
`;

const MenuTitle = styled.div`
  padding: ${(props) => props.theme.spaces[4]}px 0px;
  color: ${(props) => props.theme.colors.comments.contextMenuTitle};
  ${MenuItem}:hover & {
    color: ${(props) => props.theme.colors.comments.contextMenuTitleHover};
  }
`;

interface Option {
  icon: string;
  display: string;
  onClick: typeof noop;
}

type Props = {
  handleClick: typeof noop;
  option: Option;
};

function CommentContextMenuOption({ handleClick, option }: Props) {
  const onClickHandler = useCallback(() => handleClick(option), [handleClick]);

  return (
    <MenuItem onClick={onClickHandler}>
      <MenuIcon>
        <Icon keepColors name={option.icon as IconName} size={IconSize.XL} />
      </MenuIcon>
      <MenuTitle>{option.display}</MenuTitle>
    </MenuItem>
  );
}

export default CommentContextMenuOption;
