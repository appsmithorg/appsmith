import React from "react";
import { Category, Text, TextType } from "design-system-old";
import { Colors } from "constants/Colors";
import { useDispatch, useSelector } from "react-redux";
import { ASSETS_CDN_URL } from "constants/ThirdPartyConstants";
import {
  ACTIVATE,
  ACTIVE,
  ADMIN_BILLING_SETTINGS_TITLE,
  BILLING_AND_USAGE,
  createMessage,
  LICENSE_EXPIRY_DATE,
  PASTE_LICENSE_KEY,
  PORTAL,
  TRIAL,
  UPDATE,
  UPDATE_LICENSE,
  LICENSE_KEY,
} from "@appsmith/constants/messages";
import { BillingPageHeader } from "./Header";
import {
  BillingPageWrapper,
  StyledDialog,
  DialogWrapper,
  FlexWrapper,
  DialogHeaderImg,
} from "./styles";
import { BillingPageContent } from "./BillingPageContent";
import { CtaText } from "./CTAText";
import {
  getDateString,
  goToCustomerPortal,
} from "@appsmith/utils/billingUtils";
import { BillingDashboardCard, CTAButtonType } from "./types";
import { StatusBadge, Status } from "./StatusBadge";
import {
  getLicenseKey,
  isTrialLicense,
  getLicenseStatus,
  isLicenseModalOpen,
  getExpiry,
} from "@appsmith/selectors/tenantSelectors";
import { LicenseForm } from "../setup/LicenseForm";
import { showLicenseModal } from "@appsmith/actions/tenantActions";

const headerProps = {
  title: createMessage(ADMIN_BILLING_SETTINGS_TITLE),
};

const CtaConfig: CTAButtonType = {
  action: goToCustomerPortal,
  text: createMessage(PORTAL).toLocaleUpperCase(),
};

const statusTextMap: Partial<Record<Status, string>> = {
  [Status.ACTIVE]: createMessage(ACTIVE),
  [Status.TRIAL]: createMessage(TRIAL),
};

export function Billing() {
  const licenseKey = useSelector(getLicenseKey);
  const isTrial = useSelector(isTrialLicense);
  const expiry = useSelector(getExpiry);
  const expiryDate = getDateString(expiry * 1000);
  const licenseStatus = useSelector(getLicenseStatus);

  const isOpen = useSelector(isLicenseModalOpen);
  const dispatch = useDispatch();
  const cards: BillingDashboardCard[] = [
    {
      icon: "money-dollar-circle-line",
      title: (
        <Text color={Colors.SCORPION} type={TextType.P0} weight="500">
          {createMessage(BILLING_AND_USAGE)}
        </Text>
      ),
      action: (
        <CtaText
          category={Category.tertiary}
          className="portal-btn"
          icon="share-2"
          tag={"a"}
          {...CtaConfig}
        />
      ),
    },
    {
      icon: "key-2-line",
      title: (
        <FlexWrapper align="center" dir="row">
          <Text color={Colors.SCORPION} type={TextType.P0} weight="500">
            {createMessage(LICENSE_KEY)}
          </Text>
          <StatusBadge status={licenseStatus} statusTextMap={statusTextMap} />
        </FlexWrapper>
      ),
      content: (
        <FlexWrapper dir="column">
          <Text color={Colors.GRAY_500} type={TextType.P3} weight="500">
            {licenseKey}
          </Text>
          {isTrial && (
            <Text color={Colors.GREEN} type={TextType.P3} weight="500">
              {createMessage(() => LICENSE_EXPIRY_DATE(expiryDate))}
            </Text>
          )}
        </FlexWrapper>
      ),
      action: (
        <CtaText
          action={() => dispatch(showLicenseModal(true))}
          category={Category.secondary}
          className="update-license-btn"
          tag={"button"}
          text={createMessage(UPDATE)}
        />
      ),
    },
  ];

  return (
    <BillingPageWrapper>
      <BillingPageHeader {...headerProps} />
      <BillingPageContent cards={cards} />
      <StyledDialog
        canOutsideClickClose
        isOpen={isOpen}
        onClose={() => dispatch(showLicenseModal(false))}
        title=""
        width="456px"
      >
        <DialogWrapper>
          <DialogHeaderImg
            className="no-sub-img"
            loading="lazy"
            src={`${ASSETS_CDN_URL}/upgrade-box.svg`}
          />
          <Text type={TextType.H1}>{createMessage(UPDATE_LICENSE)}</Text>
          <LicenseForm
            actionBtnText={createMessage(ACTIVATE)}
            placeholder={createMessage(PASTE_LICENSE_KEY)}
          />
        </DialogWrapper>
      </StyledDialog>
    </BillingPageWrapper>
  );
}
