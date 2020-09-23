import React from "react";
import { CommonComponentProps } from "components/ads/common";
import { getInitialsAndColorCode } from "utils/AppsmithUtils";
import { useSelector } from "react-redux";
import { getThemeDetails } from "selectors/themeSelectors";
import Text, { TextType } from "components/ads/Text";
import styled from "styled-components";
import { Position } from "@blueprintjs/core";
import Menu from "components/ads/Menu";
import ThemeSwitcher from "./ThemeSwitcher";
import MenuDivider from "components/ads/MenuDivider";
import MenuItem from "components/ads/MenuItem";
import {
  getOnSelectAction,
  DropdownOnSelectActions,
} from "./CustomizedDropdown/dropdownHelpers";
import { ReduxActionTypes } from "constants/ReduxActionConstants";

type TagProps = CommonComponentProps & {
  onClick?: (text: string) => void;
  userName?: string;
};

const ProfileImage = styled.div<{ backgroundColor?: string }>`
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  border-radius: 50%;
  justify-content: center;
  cursor: pointer;
  background-color: ${props => props.backgroundColor};
`;

export default function ProfileDropdown(props: TagProps) {
  const themeDetails = useSelector(getThemeDetails);

  const initialsAndColorCode = getInitialsAndColorCode(
    props.userName,
    themeDetails.theme.colors.appCardColors,
  );

  return (
    <Menu
      position={Position.BOTTOM}
      target={
        <ProfileImage backgroundColor={initialsAndColorCode[1]}>
          <Text type={TextType.H6} highlight>
            {initialsAndColorCode[0]}
          </Text>
        </ProfileImage>
      }
    >
      <ThemeSwitcher />
      <MenuDivider />
      <MenuItem
        icon="logout"
        text="Sign Out"
        onSelect={() =>
          getOnSelectAction(DropdownOnSelectActions.DISPATCH, {
            type: ReduxActionTypes.LOGOUT_USER_INIT,
          })
        }
      />
    </Menu>
  );
}
