import React, { useState } from "react";
import {
  createMessage,
  NO_ACTIVE_SUBSCRIPTION,
  FREE,
  PAID,
  ADD_LICENSE,
  ADD_KEY,
  LICENSE_EXPIRED_HEADING_TRIAL,
  LICENSE_TRIAL_EXPIRED_COMMMUNITY_DOWNGRADE,
  LICENSE_TRIAL_EXPIRED_CONTINUE,
  CONTINUE,
  ALREADY_UPGRADED,
  REFRESH,
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
} from "../styles";
import PageHeader from "pages/common/PageHeader";
import { ASSETS_CDN_URL } from "constants/ThirdPartyConstants";
import { Button, Text } from "design-system";
import { getAssetUrl } from "@appsmith/utils/airgapHelpers";
import { LicenseForm } from "../LicenseForm";
import {
  isDowngradeLicenseModalOpen,
  isLicenseRefreshing,
  isLicenseUpdatingFree,
  isLicenseValidating,
} from "@appsmith/selectors/tenantSelectors";
import {
  forceLicenseCheck,
  removeLicense,
  showDowngradeLicenseModal,
} from "@appsmith/actions/tenantActions";
import DowngradeModal from "@appsmith/pages/Billing/Components/Modals/DowngradeModal";

const LICENSE_CARD_FREE = getAssetUrl(
  `${ASSETS_CDN_URL}/add-license-card-free.svg`,
);

const LICENSE_CARD_PAID = getAssetUrl(
  `${ASSETS_CDN_URL}/add-license-card-paid.svg`,
);

export default function LicenseCheckPageExpiredTrial() {
  const dispatch = useDispatch();

  const licenseValidating = useSelector(isLicenseValidating);
  const [showLicenseForm, setShowLicenseForm] = useState(false);
  const licenseRefreshing = useSelector(isLicenseRefreshing);
  const isDowngradeModalOpen = useSelector(isDowngradeLicenseModalOpen);
  const isFree = useSelector(isLicenseUpdatingFree);

  const startFreePlanClick = () => {
    setShowLicenseForm(false);
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
            {createMessage(LICENSE_EXPIRED_HEADING_TRIAL)}
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
                {createMessage(LICENSE_TRIAL_EXPIRED_CONTINUE)}
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
                  {createMessage(ALREADY_UPGRADED)}
                </StyledContent>
                <Button
                  isLoading={licenseRefreshing}
                  kind="secondary"
                  onClick={() => dispatch(forceLicenseCheck())}
                  size="sm"
                  startIcon="refresh"
                >
                  {createMessage(REFRESH)}
                </Button>
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
