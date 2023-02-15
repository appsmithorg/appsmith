import React, { useState } from "react";
import { IconSize, Text, TextType } from "design-system-old";
import { Colors } from "constants/Colors";
import { useSelector } from "react-redux";
import { ASSETS_CDN_URL } from "constants/ThirdPartyConstants";
import {
  ACTIVATE,
  ADMIN_BILLING_SETTINGS_SUBTITLE,
  ADMIN_BILLING_SETTINGS_TITLE,
  BILLING_AND_USAGE,
  createMessage,
  LICENSE_EXPIRY_DATE,
  OPEN_CUSTOMER_PORTAL,
  PASTE_LICENSE_KEY,
  UPDATE,
  UPDATE_LICENSE,
  YOUR_LICENSE_KEY,
} from "@appsmith/constants/messages";
import { BillingPageHeader } from "./Header";
import {
  BillingPageWrapper,
  HeaderText,
  StyledDialog,
  DialogWrapper,
  FlexWrapper,
  DialogHeaderImg,
} from "./styles";
import { BillingPageContent } from "./BillingPageContent";
import { CtaText } from "./CTAText";
import { BillingDashboardCard, CTATextType, LICENSE_ORIGIN } from "./types";
import { goToCustomerPortal } from "@appsmith/utils/billingUtils";
import { StatusBadge, Status } from "./StatusBadge";
import {
  getLicenseKey,
  isTrialLicense,
  getLicenseExpiry,
  getLicenseStatus,
  getLicenseOrigin,
} from "@appsmith/selectors/tenantSelectors";
import { LicenseForm } from "../setup/LicenseForm";

const headerProps = {
  title: createMessage(ADMIN_BILLING_SETTINGS_TITLE),
  subtitle: createMessage(ADMIN_BILLING_SETTINGS_SUBTITLE),
};

const CtaConfig: CTATextType = {
  action: goToCustomerPortal,
  icon: {
    fillColor: Colors.PURPLE,
    name: "arrow-forward",
    size: IconSize.XXL,
  },
  text: createMessage(OPEN_CUSTOMER_PORTAL).toLocaleUpperCase(),
};

const statusTextMap: Partial<Record<Status, string>> = {
  [Status.ACTIVE]: "Active subscription",
  [Status.INACTIVE]: "Inactive",
  [Status.TRIAL]: "Trial version",
};

export function Billing() {
  const licenseKey = useSelector(getLicenseKey);
  const isTrial = useSelector(isTrialLicense);
  const expiryDate = useSelector(getLicenseExpiry);
  const licenseStatus = useSelector(getLicenseStatus);
  const isSelfServe =
    useSelector(getLicenseOrigin) !== LICENSE_ORIGIN.ENTERPRISE;
  const [isOpen, setIsOpen] = useState(false);

  const cards: BillingDashboardCard[] = [];

  // Push billing card only if the license is self-serve
  if (isSelfServe) {
    cards.push({
      icon: "money-dollar-circle-line",
      title: (
        <HeaderText type={TextType.H3} weight="700">
          {createMessage(BILLING_AND_USAGE)}
        </HeaderText>
      ),
      subtitle: <CtaText {...CtaConfig} />,
    });
  }

  // Push remaining cards
  cards.push({
    icon: "key-2-line",
    title: (
      <FlexWrapper align="center" dir="row">
        <HeaderText type={TextType.H3} weight="700">
          {createMessage(YOUR_LICENSE_KEY)}
        </HeaderText>
        <StatusBadge status={licenseStatus} statusTextMap={statusTextMap} />
      </FlexWrapper>
    ),
    content: (
      <FlexWrapper dir="column">
        <Text type={TextType.H2}>{licenseKey}</Text>
        {isTrial && (
          <Text color={Colors.GREEN} type={TextType.P1} weight="500">
            {createMessage(() => LICENSE_EXPIRY_DATE(expiryDate))}
          </Text>
        )}
      </FlexWrapper>
    ),
    subtitle: (
      <CtaText
        {...CtaConfig}
        action={() => setIsOpen(true)}
        text={createMessage(UPDATE)}
      />
    ),
  });

  return (
    <BillingPageWrapper>
      <BillingPageHeader {...headerProps} />
      <BillingPageContent cards={cards} />
      <StyledDialog
        canOutsideClickClose
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
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
