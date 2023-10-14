import React, { useState } from "react";
import {
  createMessage,
  LICENSE_GET_STARTED_MESSAGE,
  LICENSE_KEY_CTA_LABEL,
  NO_ACTIVE_SUBSCRIPTION,
  VISIT_CUSTOMER_PORTAL,
  LICENSE_GET_STARTED_HEADING,
  LICENSE_GET_STARTED_MESSAGE_NEXT,
  FREE,
  FREE_SUBTEXT,
  GET_STARTED,
  PAID_SUBTEXT,
  PAID,
  ADD_LICENSE,
  ADD_KEY,
} from "@appsmith/constants/messages";
import { useDispatch, useSelector } from "react-redux";
import {
  StyledPageWrapper,
  StyledBannerWrapper,
  StyledCardWrapper,
  StyledContent,
  StyledLinkWrapper,
  StyledLink,
  StyledCardContent,
  StyledDivider,
} from "./../styles";
import PageHeader from "pages/common/PageHeader";
import { ASSETS_CDN_URL } from "constants/ThirdPartyConstants";
import { Button, Text } from "design-system";
import { getAssetUrl } from "@appsmith/utils/airgapHelpers";
import { LicenseForm } from "../LicenseForm";
import {
  isLicenseUpdatingFree,
  isLicenseValidating,
} from "@appsmith/selectors/tenantSelectors";
import { validateLicense } from "@appsmith/actions/tenantActions";
import { CUSTOMER_PORTAL_PLANS_URL } from "@appsmith/constants/BillingConstants";
const LICENSE_CARD_FREE = getAssetUrl(
  `${ASSETS_CDN_URL}/add-license-card-free.svg`,
);

const LICENSE_CARD_PAID = getAssetUrl(
  `${ASSETS_CDN_URL}/add-license-card-paid.svg`,
);

export default function LicenseCheckPageFreshInstance() {
  const licenseValidating = useSelector(isLicenseValidating);
  const isFreeLicenseSelected = useSelector(isLicenseUpdatingFree);
  const [showLicenseForm, setShowLicenseForm] = useState(false);
  const dispatch = useDispatch();

  const startFreePlanClick = () => {
    setShowLicenseForm(false);
    //send empty key in case of onboarding for free plan
    dispatch(validateLicense("", true));
  };
  return (
    <>
      <PageHeader hideEditProfileLink />
      <StyledPageWrapper>
        <StyledBannerWrapper>
          <Text
            data-testid="t--no-active-subscription-text"
            kind="heading-xl"
            renderAs="h1"
          >
            {createMessage(LICENSE_GET_STARTED_HEADING)}
          </Text>
          {
            <div className="gap-0 text-center">
              <Text
                color="var(--ads-v2-color-fg-emphasis)"
                data-testid="t--secondary-header-text"
                kind="body-m"
                renderAs="p"
              >
                {createMessage(LICENSE_GET_STARTED_MESSAGE)}
              </Text>
              <Text
                color="var(--ads-v2-color-fg-emphasis)"
                data-testid="t--secondary-header-text"
                kind="body-m"
                renderAs="p"
              >
                {createMessage(LICENSE_GET_STARTED_MESSAGE_NEXT)}
              </Text>
            </div>
          }
        </StyledBannerWrapper>
        <div className="flex mt-5 ">
          <StyledCardWrapper
            className="border-right-1"
            data-testid="t--license-check-card-wrapper-free"
          >
            <StyledCardContent>
              <img
                alt={createMessage(NO_ACTIVE_SUBSCRIPTION)}
                className="!h-60"
                loading="lazy"
                src={LICENSE_CARD_FREE}
              />
              <Text kind="heading-m" renderAs="p">
                {createMessage(FREE)}
              </Text>
              <Text kind="body-m" renderAs="p">
                {createMessage(FREE_SUBTEXT)}
              </Text>
              <div>
                <Button
                  className="w-2/5 mt-4"
                  data-testid="t--activate-instance-btn-free"
                  isLoading={licenseValidating && isFreeLicenseSelected}
                  onClick={() => startFreePlanClick()}
                  size="md"
                >
                  {createMessage(GET_STARTED)}
                </Button>
              </div>
            </StyledCardContent>
          </StyledCardWrapper>
          <StyledDivider orientation="vertical" />
          <StyledCardWrapper data-testid="t--license-check-card-wrapper-paid">
            <StyledCardContent>
              <img
                alt={createMessage(NO_ACTIVE_SUBSCRIPTION)}
                className="!h-60"
                loading="lazy"
                src={LICENSE_CARD_PAID}
              />
              <Text kind="heading-m" renderAs="p">
                {createMessage(PAID)}
              </Text>
              <Text kind="body-m" renderAs="p">
                {createMessage(PAID_SUBTEXT)}
              </Text>
              {!showLicenseForm && (
                <div>
                  <Button
                    className="w-2/5 mt-4"
                    data-testid="t--activate-instance-btn-paid"
                    kind="secondary"
                    onClick={() => setShowLicenseForm(true)}
                    size="md"
                  >
                    {createMessage(ADD_LICENSE)}
                  </Button>
                </div>
              )}
              {showLicenseForm && (
                <div className="mt-4">
                  <LicenseForm
                    isModal={false}
                    isUpdate={false}
                    placeholder={createMessage(ADD_KEY)}
                  />
                </div>
              )}
            </StyledCardContent>

            {
              <StyledLinkWrapper>
                <StyledContent data-testid="t--get-license-key-label">
                  {createMessage(LICENSE_KEY_CTA_LABEL)}
                </StyledContent>
                <StyledLink
                  data-testid="t--customer-portal-cta"
                  endIcon="arrow-right-line"
                  startIcon="share-2"
                  to={CUSTOMER_PORTAL_PLANS_URL}
                >
                  {createMessage(VISIT_CUSTOMER_PORTAL)}
                </StyledLink>
              </StyledLinkWrapper>
            }
          </StyledCardWrapper>
        </div>
      </StyledPageWrapper>
    </>
  );
}
