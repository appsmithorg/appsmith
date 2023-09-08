import React, { useEffect } from "react";
import {
  ACTIVATE_INSTANCE,
  ADD_KEY,
  createMessage,
  LICENSE_GET_STARTED_MESSAGE,
  LICENSE_KEY_CTA_LABEL,
  LICENSE_KEY_FORM_INPUT_LABEL,
  NO_ACTIVE_SUBSCRIPTION,
  LICENSE_ERROR_TITLE,
  LICENSE_ERROR_DESCRIPTION,
  VISIT_CUSTOMER_PORTAL,
} from "@appsmith/constants/messages";
import { goToCustomerPortal } from "@appsmith/utils/billingUtils";
import {
  StyledPageWrapper,
  StyledBannerWrapper,
  StyledCardWrapper,
  StyledContent,
  StyledCard,
  IconBadge,
  StyledLinkWrapper,
  StyledLink,
} from "./styles";
import { requiresAuth } from "pages/UserAuth/requiresAuthHOC";
import { LicenseForm } from "./LicenseForm";
import { useSelector } from "react-redux";
import { isAdminUser } from "@appsmith/selectors/tenantSelectors";
import PageHeader from "pages/common/PageHeader";
import Page from "pages/common/ErrorPages/Page";
import styled from "styled-components";
import { ASSETS_CDN_URL } from "constants/ThirdPartyConstants";
import { Icon, Text } from "design-system";
import { getAssetUrl, isAirgapped } from "@appsmith/utils/airgapHelpers";
import { getAppsmithConfigs } from "@appsmith/configs";

const { intercomAppID } = getAppsmithConfigs();

const StyledIcon = styled(Icon)`
  transform: scale(1.5);
  margin-bottom: 15px;
`;

function LicenseCheckPage() {
  const showLicenseUpdateForm = useSelector(isAdminUser);
  const isAirgappedInstance = isAirgapped();

  function hideIntercomLauncher(val: boolean) {
    if (intercomAppID && window.Intercom) {
      window.Intercom("boot", {
        app_id: intercomAppID,
        hide_default_launcher: val,
      });
    }
  }

  useEffect(() => {
    hideIntercomLauncher(false);
    return () => hideIntercomLauncher(true);
  }, []);

  if (!showLicenseUpdateForm) {
    return (
      <>
        <PageHeader hideEditProfileLink />
        <Page
          description={createMessage(LICENSE_ERROR_DESCRIPTION)}
          errorIcon={<StyledIcon name="warning-line" size="md" />}
          title={createMessage(LICENSE_ERROR_TITLE)}
        />
      </>
    );
  } else {
    return (
      <>
        <PageHeader hideEditProfileLink />
        <StyledPageWrapper>
          <StyledBannerWrapper>
            <img
              alt={createMessage(NO_ACTIVE_SUBSCRIPTION)}
              className="no-sub-img"
              loading="lazy"
              src={getAssetUrl(`${ASSETS_CDN_URL}/upgrade-box.svg`)}
              width="180"
            />
            <Text
              data-testid="t--no-active-subscription-text"
              kind="heading-l"
              renderAs="h1"
            >
              {createMessage(NO_ACTIVE_SUBSCRIPTION)}
            </Text>
            {!isAirgappedInstance && (
              <Text
                color="var(--ads-v2-color-fg-emphasis)"
                data-testid="t--secondary-header-text"
                renderAs="p"
              >
                {createMessage(LICENSE_GET_STARTED_MESSAGE)}
              </Text>
            )}
          </StyledBannerWrapper>
          <StyledCardWrapper data-testid="t--license-check-card-wrapper">
            <StyledCard data-testid="t--license-check-form-card">
              <IconBadge>
                <Icon name="key-2-line" size="lg" />
              </IconBadge>
              <LicenseForm
                actionBtnText={createMessage(ACTIVATE_INSTANCE)}
                isModal={false}
                label={createMessage(LICENSE_KEY_FORM_INPUT_LABEL)}
                placeholder={createMessage(ADD_KEY)}
              />
            </StyledCard>
            {!isAirgappedInstance && (
              <StyledLinkWrapper>
                <StyledContent data-testid="t--get-license-key-label">
                  {createMessage(LICENSE_KEY_CTA_LABEL)}
                </StyledContent>
                <StyledLink
                  data-testid="t--customer-portal-cta"
                  endIcon="arrow-right-line"
                  kind="primary"
                  onClick={goToCustomerPortal}
                  startIcon="share-2"
                >
                  {createMessage(VISIT_CUSTOMER_PORTAL)}
                </StyledLink>
              </StyledLinkWrapper>
            )}
          </StyledCardWrapper>
        </StyledPageWrapper>
      </>
    );
  }
}

export default requiresAuth(LicenseCheckPage);
