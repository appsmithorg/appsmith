import React from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  ACTIVATE,
  ADMIN_BILLING_SETTINGS_TITLE,
  BILLING_AND_USAGE,
  createMessage,
  LICENSE_EXPIRY_DATE,
  PASTE_LICENSE_KEY,
  PORTAL,
  UPDATE,
  UPDATE_LICENSE,
  LICENSE_KEY,
  SELF_SERVE,
  ENTERPRISE,
  AIRGAPPED,
  LICENSE_KEY_MODAL_INPUT_LABEL,
} from "@appsmith/constants/messages";
import { BillingPageHeader } from "./Header";
import { BillingPageWrapper, FlexWrapper } from "./styles";
import { BillingPageContent } from "./BillingPageContent";
import { getDateString } from "@appsmith/utils/billingUtils";
import type { BillingDashboardCard, CTAButtonType } from "./types";
import { LICENSE_ORIGIN } from "./types";
import {
  getLicenseKey,
  isTrialLicense,
  isLicenseModalOpen,
  getExpiry,
  getLicenseOrigin,
} from "@appsmith/selectors/tenantSelectors";
import { LicenseForm } from "../setup/LicenseForm";
import { showLicenseModal } from "@appsmith/actions/tenantActions";
import { isAirgapped } from "@appsmith/utils/airgapHelpers";
import {
  Button,
  Link,
  Modal,
  ModalHeader,
  ModalContent,
  ModalBody,
  Text,
  Tag,
} from "design-system";
import { getAppsmithConfigs } from "@appsmith/configs";

const appsmithConfigs = getAppsmithConfigs();

const headerProps = {
  title: createMessage(ADMIN_BILLING_SETTINGS_TITLE),
};

const CtaConfig: CTAButtonType = {
  action: `${appsmithConfigs.customerPortalUrl}/plans`,
  text: createMessage(PORTAL),
};

const getLicenseOriginText = (licenseOrigin: string) => {
  if (licenseOrigin === LICENSE_ORIGIN.SELF_SERVE) return SELF_SERVE;
  else if (licenseOrigin === LICENSE_ORIGIN.ENTERPRISE) return ENTERPRISE;
  else return AIRGAPPED;
};

export function Billing() {
  const licenseKey = useSelector(getLicenseKey);
  const isTrial = useSelector(isTrialLicense);
  const expiry = useSelector(getExpiry);
  const expiryDate = getDateString(expiry * 1000);
  const licenseOrigin = useSelector(getLicenseOrigin);

  const isOpen = useSelector(isLicenseModalOpen);
  const dispatch = useDispatch();
  const isAirgappedInstance = isAirgapped();

  const cards: BillingDashboardCard[] = [
    {
      name: "portal-card",
      icon: "money-dollar-circle-line",
      title: (
        <Text
          color="var(--ads-v2-color-fg)"
          data-testid="t--card-title"
          kind="heading-s"
          renderAs="p"
        >
          {createMessage(BILLING_AND_USAGE)}
        </Text>
      ),
      action: (
        <Link
          className="portal-btn"
          endIcon="share-2"
          kind={"secondary"}
          rel="noopener,noreferrer"
          target="_blank"
          to={CtaConfig.action}
        >
          {CtaConfig.text}
        </Link>
      ),
    },
    {
      name: "license-key-card",
      icon: "key-2-line",
      title: (
        <FlexWrapper align="center" dir="row">
          <Text
            color="var(--ads-v2-color-fg)"
            data-testid="t--card-title"
            kind="heading-s"
            renderAs="p"
          >
            {createMessage(LICENSE_KEY)}
          </Text>
          <Tag data-testid="t--status-text" isClosable={false} size="md">
            {createMessage(getLicenseOriginText(licenseOrigin))}
          </Tag>
        </FlexWrapper>
      ),
      content: (
        <FlexWrapper dir="column">
          <Text
            color="var(--ads-v2-color-fg)"
            data-testid="t--license-key"
            renderAs="span"
          >
            {licenseKey}
          </Text>
          {isTrial && (
            <Text
              className="license-expiry-text"
              color="var(--ads-v2-color-fg-success)"
              data-testid="t--license-expiry"
              renderAs="span"
            >
              {createMessage(() => LICENSE_EXPIRY_DATE(expiryDate))}
            </Text>
          )}
        </FlexWrapper>
      ),
      action: (
        <Button
          className="update-license-btn"
          kind="secondary"
          onClick={() => dispatch(showLicenseModal(true))}
          size="md"
        >
          {createMessage(UPDATE)}
        </Button>
      ),
    },
  ].filter((card) =>
    isAirgappedInstance ? card.name !== "portal-card" : true,
  );

  return (
    <BillingPageWrapper>
      <BillingPageHeader {...headerProps} />
      <BillingPageContent cards={cards} />
      <Modal
        onOpenChange={(open: boolean) => dispatch(showLicenseModal(open))}
        open={isOpen}
      >
        <ModalContent style={{ width: "640px" }}>
          <ModalHeader>{createMessage(UPDATE_LICENSE)}</ModalHeader>
          <ModalBody>
            <LicenseForm
              actionBtnText={createMessage(ACTIVATE)}
              isModal
              label={createMessage(LICENSE_KEY_MODAL_INPUT_LABEL)}
              placeholder={createMessage(PASTE_LICENSE_KEY)}
            />
          </ModalBody>
        </ModalContent>
      </Modal>
    </BillingPageWrapper>
  );
}
