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
import { getOnboardingOrganisations } from "selectors/onboardingSelectors";
import { getAppsmithConfigs } from "@appsmith/configs";
import AnalyticsUtil from "utils/AnalyticsUtil";
import { howMuchTimeBeforeText } from "utils/helpers";
import { onboardingCreateApplication } from "actions/onboardingActions";
import ProductUpdatesModal from "pages/Applications/ProductUpdatesModal";

const Wrapper = styled.div`
  padding-bottom: 8px;
  background-color: #fff;
  position: absolute;
  bottom: 0;
  width: 100%;

  & .ads-dialog-trigger {
    margin-top: 4px;
  }

  & .ads-dialog-trigger > div {
    position: initial;
    width: 92%;
    padding: 0 14px;
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

function LeftPaneBottomSection() {
  const dispatch = useDispatch();
  const onboardingOrgs = useSelector(getOnboardingOrganisations);
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
      {!!onboardingOrgs.length && (
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
