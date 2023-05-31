import React from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  getRemainingDays,
  isAdminUser,
} from "@appsmith/selectors/tenantSelectors";
import { setBEBanner } from "@appsmith/actions/tenantActions";
import {
  BE_TRIAL_BANNER_EXPIRY_MESSAGE,
  BE_WELCOME_MESSAGE,
  createMessage,
  NO_ACTIVE_SUBSCRIPTION,
  UPGRADE_NOW,
} from "@appsmith/constants/messages";
import { goToCustomerPortal } from "@appsmith/utils/billingUtils";
import {
  BannerWrapper,
  BannerContentWrapper,
  BannerTextWrapper,
  BannerCtaWrapper,
  StyledCallout,
} from "./styles";
import { ASSETS_CDN_URL } from "constants/ThirdPartyConstants";
import { Button, Text } from "design-system";
import { getAssetUrl, isAirgapped } from "@appsmith/utils/airgapHelpers";

export function BEBanner() {
  const { days, suffix } = useSelector(getRemainingDays);
  const dispatch = useDispatch();
  const isAdmin = useSelector(isAdminUser);
  const isAirgappedInstance = isAirgapped();

  const handleClose = () => {
    localStorage.setItem("showLicenseBanner", JSON.stringify(false));
    dispatch(setBEBanner(false));
  };

  return (
    <StyledCallout>
      <BannerWrapper data-testid="t--welcome-banner">
        <BannerContentWrapper>
          <img
            alt={createMessage(NO_ACTIVE_SUBSCRIPTION)}
            className="no-sub-img"
            height="180px"
            src={getAssetUrl(`${ASSETS_CDN_URL}/upgrade-box.svg`)}
            width="180px"
          />
          <BannerTextWrapper>
            <Text
              className="main-text"
              color="var(--ads-v2-color-fg-emphasis)"
              kind="heading-m"
              renderAs="p"
            >
              🚀 {createMessage(BE_WELCOME_MESSAGE)}
            </Text>
            <p
              className="sub-text"
              dangerouslySetInnerHTML={{
                __html: createMessage(() =>
                  BE_TRIAL_BANNER_EXPIRY_MESSAGE(days, suffix),
                ),
              }}
            />
          </BannerTextWrapper>
        </BannerContentWrapper>
        <BannerCtaWrapper>
          {isAdmin && !isAirgappedInstance && (
            <Button
              className="upgrade-button"
              onClick={goToCustomerPortal}
              size="md"
            >
              {createMessage(UPGRADE_NOW)}
            </Button>
          )}
          <Button
            className="close-button"
            isIconButton
            kind="tertiary"
            onClick={handleClose}
            size="md"
            startIcon="close-line"
          />
        </BannerCtaWrapper>
      </BannerWrapper>
    </StyledCallout>
  );
}
