import React from "react";
import { useDispatch, useSelector } from "react-redux";
import styled from "styled-components";
import { Classes as BlueprintClasses } from "@blueprintjs/core";
import MenuItem from "components/ads/MenuItem";
import {
  createMessage,
  DOCUMENTATION,
  WELCOME_TOUR,
} from "@appsmith/constants/messages";
import { getIsFetchingApplications } from "selectors/applicationSelectors";
import { getOnboardingWorkspaces } from "selectors/onboardingSelectors";
import { getAppsmithConfigs } from "@appsmith/configs";
import AnalyticsUtil from "utils/AnalyticsUtil";
import { howMuchTimeBeforeText } from "utils/helpers";
import { onboardingCreateApplication } from "actions/onboardingActions";
import ProductUpdatesModal from "pages/Applications/ProductUpdatesModal";
import { Colors } from "constants/Colors";

const Wrapper = styled.div`
  padding-bottom: ${(props) => props.theme.spaces[3]}px;
  background-color: ${Colors.WHITE};
  position: absolute;
  bottom: 0;
  width: 100%;

  & .ads-dialog-trigger {
    margin-top: ${(props) => props.theme.spaces[1]}px;
  }

  & .ads-dialog-trigger > div {
    position: initial;
    width: 92%;
    padding: ${(props) =>
      `${props.theme.spaces[0]}px ${props.theme.spaces[6]}px`};
  }
`;

const LeftPaneVersionData = styled.div`
  display: flex;
  justify-content: space-between;
  color: ${Colors.MIRAGE_2};
  font-size: 8px;
  width: 92%;
  margin-top: ${(props) => props.theme.spaces[3]}px;
`;

function LeftPaneBottomSection() {
  const dispatch = useDispatch();
  const onboardingWorkspaces = useSelector(getOnboardingWorkspaces);
  const isFetchingApplications = useSelector(getIsFetchingApplications);
  const { appVersion } = getAppsmithConfigs();
  const howMuchTimeBefore = howMuchTimeBeforeText(appVersion.releaseDate);

  return (
    <Wrapper>
      <MenuItem
        className={isFetchingApplications ? BlueprintClasses.SKELETON : ""}
        icon="discord"
        onSelect={() => {
          window.open("https://discord.gg/rBTTVJp", "_blank");
        }}
        text={"Join our Discord"}
      />
      <MenuItem
        containerClassName={
          isFetchingApplications ? BlueprintClasses.SKELETON : ""
        }
        icon="book"
        onSelect={() => {
          window.open("https://docs.appsmith.com/", "_blank");
        }}
        text={createMessage(DOCUMENTATION)}
      />
      {!!onboardingWorkspaces.length && (
        <MenuItem
          containerClassName={
            isFetchingApplications
              ? BlueprintClasses.SKELETON
              : "t--welcome-tour"
          }
          icon="guide"
          onSelect={() => {
            AnalyticsUtil.logEvent("WELCOME_TOUR_CLICK");
            dispatch(onboardingCreateApplication());
          }}
          text={createMessage(WELCOME_TOUR)}
        />
      )}
      <ProductUpdatesModal />
      <LeftPaneVersionData>
        <span>Appsmith {appVersion.id}</span>
        {howMuchTimeBefore !== "" && (
          <span>Released {howMuchTimeBefore} ago</span>
        )}
      </LeftPaneVersionData>
    </Wrapper>
  );
}

export default LeftPaneBottomSection;
