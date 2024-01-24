import {
  forceLicenseCheck,
  showLicenseModal,
  showRemoveLicenseModal,
  validateLicense,
} from "@appsmith/actions/tenantActions";
import {
  START_DATE,
  END_DATE,
  EMAIL,
  CUSTOMER_PORTAL,
  MANAGE,
  PLAN,
  LICENSE,
  UPDATE,
  ADMIN_BILLING_SETTINGS_TITLE,
  SELF_SERVE,
  ENTERPRISE,
  AIRGAPPED,
  createMessage,
  REMOVE,
  FREE,
  KEY,
  REFRESH,
  CURRENT_PLAN,
} from "@appsmith/constants/messages";
import {
  getLicenseKey,
  getStartDate,
  getEndDate,
  getCustomerEmail,
  isLicenseModalOpen,
  isRemoveLicenseModalOpen,
  isDowngradeLicenseModalOpen,
  getLicensePlan,
  getProductEdition,
  isTrialLicense,
  isLicenseRefreshing,
} from "@appsmith/selectors/tenantSelectors";
import { Divider, Button, Text, Link } from "design-system";
import React, { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { BillingPageHeader } from "../Header";
import { BillingPageWrapper } from "../styles";
import {
  type BillingField,
  type CustomerPortalLink,
  LICENSE_PLAN,
  PRODUCT_EDITION,
} from "../Types/types";
import { BillingFieldsContent } from "./BillingFieldsContent";
import { CUSTOMER_PORTAL_PLANS_URL } from "@appsmith/constants/BillingConstants";
import ShowLicenceModal from "./Modals/ShowLicenseModal";
import RemoveLicenseModal from "./Modals/RemoveLicenseModal";
import DowngradeModal from "./Modals/DowngradeModal";
import { isAirgapped } from "@appsmith/utils/airgapHelpers";

const headerProps = {
  title: createMessage(ADMIN_BILLING_SETTINGS_TITLE),
};

const getLicenseOriginText = (licensePlan: string, productEdition: string) => {
  if (licensePlan === LICENSE_PLAN.BUSINESS) return SELF_SERVE;
  else if (
    licensePlan === LICENSE_PLAN.ENTERPRISE &&
    productEdition === PRODUCT_EDITION.COMMERCIAL
  )
    return ENTERPRISE;
  else if (
    licensePlan === LICENSE_PLAN.ENTERPRISE &&
    productEdition === PRODUCT_EDITION.AIR_GAP
  )
    return AIRGAPPED;
  return FREE;
};

export function BillingPagePaid() {
  const licenseKey = useSelector(getLicenseKey);
  const licensePlan = useSelector(getLicensePlan);
  const productEdition = useSelector(getProductEdition);
  const startDate = useSelector(getStartDate);
  const endDate = useSelector(getEndDate);
  const email = useSelector(getCustomerEmail);
  const isUpdateModalOpen = useSelector(isLicenseModalOpen);
  const isRemoveModalOpen = useSelector(isRemoveLicenseModalOpen);
  const isDowngradeModalOpen = useSelector(isDowngradeLicenseModalOpen);
  const licenseRefreshing = useSelector(isLicenseRefreshing);
  const isTrial = useSelector(isTrialLicense);
  const isAirgappedInstance = isAirgapped();
  const dispatch = useDispatch();

  const [actualLicenseKey, setActualLicenseKey] = useState("");

  function refreshLicense(): void {
    dispatch(forceLicenseCheck());
  }

  const billingFields: BillingField[] = [
    {
      label: createMessage(CURRENT_PLAN),
      value: `${createMessage(
        getLicenseOriginText(licensePlan, productEdition),
      )}${isTrial ? " • Trial" : ""}`,
      selector: "t--license-plan-name",
    },
    {
      label: createMessage(START_DATE),
      value: startDate,
      selector: "t--license-plan-startdate",
    },
    {
      label: createMessage(END_DATE),
      value: endDate,
      selector: "t--license-plan-enddate",
    },
    {
      label: createMessage(EMAIL),
      value: email,
      selector: "t--license-plan-email",
    },
  ];

  const customerPortalLink: CustomerPortalLink = {
    action: `${CUSTOMER_PORTAL_PLANS_URL}`,
    text: createMessage(CUSTOMER_PORTAL),
    label: createMessage(MANAGE),
  };

  function onUpgradeDowngradeClick(key: string) {
    setActualLicenseKey(key);
  }

  const onUpdateLicenseClick = () => {
    if (actualLicenseKey) {
      dispatch(validateLicense(actualLicenseKey, false));
    }
  };

  return (
    <BillingPageWrapper>
      <BillingPageHeader {...headerProps} />
      <div className="mt-8" data-testid="t--plan-content">
        <div>
          <Text
            color="var(--ads-v2-color-fg)"
            data-testid="t--card-title"
            kind="heading-m"
            renderAs="p"
          >
            {createMessage(PLAN)}
          </Text>
        </div>

        <BillingFieldsContent billingFields={billingFields} />

        <div className="flex gap-8 mt-4">
          <div className="w-40">
            <Text color="var(--ads-v2-color-fg)" kind="heading-xs">
              {customerPortalLink.label}:{" "}
            </Text>
          </div>
          <div>
            <Link
              className="portal-btn"
              endIcon="share-2"
              kind="primary"
              target="_blank"
              to={customerPortalLink.action}
            >
              {customerPortalLink.text}
            </Link>
          </div>
        </div>
      </div>
      <div className="my-6 width-3/5">
        <Divider />
      </div>
      {
        <div data-testid="t--license-content">
          <div>
            <Text
              color="var(--ads-v2-color-fg)"
              data-testid="t--license-card-title"
              kind="heading-m"
              renderAs="p"
            >
              {createMessage(LICENSE)}
            </Text>
          </div>
          <div className="flex items-center mt-4">
            <div className="w-40">
              <Text color="var(--ads-v2-color-fg)" kind="heading-xs">
                {createMessage(KEY)}:{" "}
              </Text>
            </div>
            <div className="ml-8">
              <Text data-testid="t--license-key" kind="body-m">
                {licenseKey}
              </Text>
            </div>
            <div className="ml-2">
              <Button
                data-testid="t--refresh-license-btn"
                isLoading={licenseRefreshing}
                kind="secondary"
                onClick={() => refreshLicense()}
                size="sm"
                startIcon="refresh"
              >
                {createMessage(REFRESH)}
              </Button>
            </div>
          </div>
          <div className="flex gap-2 mt-4 ml-48">
            <Button
              className="update-license-btn"
              kind="secondary"
              onClick={() => dispatch(showLicenseModal(true))}
              size="md"
            >
              {createMessage(UPDATE)}
            </Button>
            {!isAirgappedInstance && (
              <Button
                className="update-license-btn"
                kind="error"
                onClick={() => dispatch(showRemoveLicenseModal(true))}
                size="md"
              >
                {createMessage(REMOVE)}
              </Button>
            )}
          </div>
        </div>
      }
      <ShowLicenceModal
        isUpdateModalOpen={isUpdateModalOpen}
        onUpgradeDowngradeClick={onUpgradeDowngradeClick}
      />
      <RemoveLicenseModal isRemoveModalOpen={isRemoveModalOpen} />
      <DowngradeModal
        isExpired={false}
        isOpen={isDowngradeModalOpen}
        onUpdateLicenseClick={onUpdateLicenseClick}
      />
    </BillingPageWrapper>
  );
}
