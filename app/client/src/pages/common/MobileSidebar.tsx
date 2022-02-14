import React from "react";
import styled from "styled-components";
import { Colors } from "constants/Colors";
import ProfileImage from "pages/common/ProfileImage";
import MenuItem from "components/ads/MenuItem";
import { ADMIN_SETTINGS_CATEGORY_DEFAULT_URL } from "constants/routes";
import {
  getOnSelectAction,
  DropdownOnSelectActions,
} from "./CustomizedDropdown/dropdownHelpers";
import { ReduxActionTypes } from "constants/ReduxActionConstants";
import { useSelector } from "react-redux";
import { getCurrentUser } from "selectors/usersSelectors";
import {
  createMessage,
  ADMIN_SETTINGS,
  DOCUMENTATION,
} from "@appsmith/constants/messages";
import { getAppsmithConfigs } from "@appsmith/configs";
import { howMuchTimeBeforeText } from "utils/helpers";

type MobileSideBarProps = {
  name: string;
  isOpen: boolean;
  userName?: string;
  photoId?: string;
};

const MainContainer = styled.div<{ isOpen: boolean }>`
  position: absolute;
  top: 49px; /* height of mobile header */
  left: ${({ isOpen }) => (isOpen ? `0` : `-100vw`)};
  width: 100vw;
  height: calc(100vh - 49px);
  background-color: ${Colors.WHITE};
  transition: left 0.6s ease;
  padding: 16px;
`;

const Section = styled.div`
  padding: 20px 0;
  border-bottom: 1px solid ${Colors.MERCURY};

  & > h4 {
    color: ${Colors.BLACK};
    font-size: 13px;
    font-weight: 600;
    margin-left: 4px;
  }
`;

const ProfileSection = styled(Section)`
  display: flex;
  align-items: center;
`;

const UserNameSection = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  margin-left: 12px;
`;

const Name = styled.span`
  font-weight: 600;
  color: ${Colors.BLACK};
  font-size: 16px;
`;

const Email = styled.span`
  font-size: 14px;
  color: ${Colors.GREY_8};
`;

const StyledMenuItem = styled(MenuItem)`
  svg {
    width: 16px;
    height: 16px;
    fill: ${Colors.DARK_GRAY};
  }

  .cs-text {
    color: ${Colors.BLACK};
    font-size: 16px;
  }
`;

const LeftPaneVersionData = styled.div`
  display: flex;
  justify-content: space-between;
  color: #121826;
  font-size: 8px;
  width: 92%;
  margin-top: 8px;
`;

export default function MobileSideBar(props: MobileSideBarProps) {
  const user = useSelector(getCurrentUser);
  const { appVersion } = getAppsmithConfigs();
  const howMuchTimeBefore = howMuchTimeBeforeText(appVersion.releaseDate);

  return (
    <MainContainer isOpen={props.isOpen}>
      <ProfileSection>
        <ProfileImage
          className="t--profile-menu-icon"
          side={52}
          source={!!props.photoId ? `/api/v1/assets/${props.photoId}` : ""}
          userName={props.name || props.userName}
        />
        <UserNameSection>
          <Name>{props.name}</Name>
          <Email>{props.userName}</Email>
        </UserNameSection>
      </ProfileSection>
      <Section>
        <h4>ACCOUNT</h4>
        {user?.isSuperUser && user?.isConfigurable && (
          <StyledMenuItem
            className={`t--admin-settings-menu`}
            icon="setting"
            onSelect={() => {
              getOnSelectAction(DropdownOnSelectActions.REDIRECT, {
                path: ADMIN_SETTINGS_CATEGORY_DEFAULT_URL,
              });
            }}
            text={createMessage(ADMIN_SETTINGS)}
          />
        )}
        <StyledMenuItem
          className="t--logout-icon"
          icon="logout"
          onSelect={() =>
            getOnSelectAction(DropdownOnSelectActions.DISPATCH, {
              type: ReduxActionTypes.LOGOUT_USER_INIT,
            })
          }
          text="Sign Out"
        />
      </Section>
      <Section>
        <StyledMenuItem
          icon="discord"
          onSelect={() => {
            window.open("https://discord.gg/rBTTVJp", "_blank");
          }}
          text={"Join our Discord"}
        />
        <StyledMenuItem
          icon="book"
          onSelect={() => {
            window.open("https://docs.appsmith.com/", "_blank");
          }}
          text={createMessage(DOCUMENTATION)}
        />
      </Section>
      <LeftPaneVersionData>
        <span>Appsmith {appVersion.id}</span>
        {howMuchTimeBefore !== "" && (
          <span>Released {howMuchTimeBefore} ago</span>
        )}
      </LeftPaneVersionData>
    </MainContainer>
  );
}
