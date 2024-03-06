import React, { useState } from "react";
import {
  createMessage,
  NO_ACTIVE_SUBSCRIPTION,
  PAID,
  ADD_LICENSE,
  ADD_KEY,
  LICENSE_TRIAL_EXPIRED_COMMMUNITY_DOWNGRADE,
  CONTINUE,
  LICENSE_EXPIRED_HEADING_PAID,
  CONTACT_US,
  LICENSE_PAID_EXPIRED_CONTINUE,
  NEED_NEW_LICENSE,
  FREE,
} from "@appsmith/constants/messages";
import { useDispatch, useSelector } from "react-redux";
import {
  StyledPageWrapper,
  StyledBannerWrapper,
  StyledCardWrapper,
  StyledContent,
  StyledLinkWrapper,
  StyledCardContent,
  StyledDivider,
  StyledLink,
} from "../styles";
import PageHeader from "pages/common/PageHeader";
import { ASSETS_CDN_URL } from "constants/ThirdPartyConstants";
import { Button, Text } from "design-system";
import { getAssetUrl } from "@appsmith/utils/airgapHelpers";
import { LicenseForm } from "../LicenseForm";
import {
  isDowngradeLicenseModalOpen,
  isLicenseUpdatingFree,
  isLicenseValidating,
} from "@appsmith/selectors/tenantSelectors";
import {
  removeLicense,
  showDowngradeLicenseModal,
} from "@appsmith/actions/tenantActions";
import { getAppsmithConfigs } from "@appsmith/configs";
import DowngradeModal from "@appsmith/pages/Billing/Components/Modals/DowngradeModal";

const appsmithConfigs = getAppsmithConfigs();

const LICENSE_CARD_FREE = getAssetUrl(
  `${ASSETS_CDN_URL}/add-license-card-free.svg`,
);

const LICENSE_CARD_PAID = getAssetUrl(
  `${ASSETS_CDN_URL}/add-license-card-paid.svg`,
);

const MAIL_TO_SUPPORT = `mailto:${appsmithConfigs.appsmithSupportEmail}`;

export default function LicenseCheckPageExpiredPaid() {
  const licenseValidating = useSelector(isLicenseValidating);
  const [showLicenseForm, setShowLicenseForm] = useState(false);
  const dispatch = useDispatch();
  const isDowngradeModalOpen = useSelector(isDowngradeLicenseModalOpen);
  const isFree = useSelector(isLicenseUpdatingFree);
  const startFreePlanClick = () => {
    dispatch(showDowngradeLicenseModal(true));
  };

  const onUpdateLicenseClick = () => {
    dispatch(removeLicense());
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
            {createMessage(LICENSE_EXPIRED_HEADING_PAID)}
          </Text>
        </StyledBannerWrapper>
        <div className="flex mt-8">
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
                {createMessage(LICENSE_TRIAL_EXPIRED_COMMMUNITY_DOWNGRADE)}
              </Text>
              <div>
                <Button
                  className="w-2/5 mt-4"
                  data-testid="t--activate-instance-btn-free"
                  isLoading={licenseValidating && isFree}
                  onClick={() => startFreePlanClick()}
                  size="md"
                >
                  {createMessage(CONTINUE)}
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
                {createMessage(LICENSE_PAID_EXPIRED_CONTINUE)}
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
                  {createMessage(NEED_NEW_LICENSE)}
                </StyledContent>
                <StyledLink to={MAIL_TO_SUPPORT}>
                  {createMessage(CONTACT_US)}
                </StyledLink>
              </StyledLinkWrapper>
            }
          </StyledCardWrapper>
        </div>
      </StyledPageWrapper>
      <DowngradeModal
        isExpired
        isOpen={isDowngradeModalOpen}
        onUpdateLicenseClick={onUpdateLicenseClick}
      />
    </>
  );
}
