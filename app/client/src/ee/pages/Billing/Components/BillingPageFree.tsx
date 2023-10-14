import {
  ACTIVATE,
  ADD_KEY,
  ADMIN_BILLING_SETTINGS_TITLE,
  DONT_HAVE_LICENSE,
  GET_ONE_NOW,
  PASTE_LICENSE,
  createMessage,
} from "@appsmith/constants/messages";
import React, { useEffect, useState } from "react";
import { BillingPageWrapper, InputWrapper, StyledInputBox } from "../styles";
import { BillingPageHeader } from "../Header";
import { Button, Link, Text } from "design-system";
import { useDispatch, useSelector } from "react-redux";
import { validateLicense } from "@appsmith/actions/tenantActions";
import { isEmptyString } from "utils/formhelpers";
import { isLicenseValidating } from "@appsmith/selectors/tenantSelectors";
import { CUSTOMER_PORTAL_PLANS_URL } from "@appsmith/constants/BillingConstants";

const headerProps = {
  title: createMessage(ADMIN_BILLING_SETTINGS_TITLE),
};
const customerPortalLink = {
  action: `${CUSTOMER_PORTAL_PLANS_URL}`,
  text: createMessage(GET_ONE_NOW),
};

export function BillingPageFree() {
  const [licenseKey, setLicenceKey] = useState("");
  const [isLicenseEmpty, setIsLicenseEmpty] = useState(true);
  const dispatch = useDispatch();

  const licenseValidating = useSelector(isLicenseValidating);

  useEffect(() => {
    if (isEmptyString(licenseKey)) {
      setIsLicenseEmpty(true);
    } else {
      setIsLicenseEmpty(false);
    }
  }, [licenseKey]);

  function handleInputChange(input: string): void {
    setLicenceKey(input);
  }

  function handleActivateClick(): void {
    if (licenseKey) {
      dispatch(validateLicense(licenseKey, false));
    }
  }

  return (
    <BillingPageWrapper>
      <BillingPageHeader {...headerProps} />
      <div data-testid="t--free-license-content">
        <div className="mt-8">
          <div className="flex gap-1">
            <Text kind="body-m">{createMessage(PASTE_LICENSE)}</Text>
            <Text kind="body-m">{createMessage(DONT_HAVE_LICENSE)}</Text>
            <Link
              className="portal-btn"
              data-testid="t--customer-portal-link-free"
              endIcon="share-2"
              kind="primary"
              target="_blank"
              to={customerPortalLink.action}
            >
              {customerPortalLink.text}
            </Link>
          </div>
        </div>
        <InputWrapper className="gap-2">
          <StyledInputBox
            data-testid="t--license-input-free"
            name="licenseKeyInputFree"
            onChange={handleInputChange}
            placeholder={createMessage(ADD_KEY)}
            size="md"
          />
          <Button
            data-testid="t--activate-instance-btn-free"
            isDisabled={isLicenseEmpty}
            isLoading={licenseValidating}
            kind="primary"
            onClick={() => handleActivateClick()}
            size="md"
            type="button"
          >
            {createMessage(ACTIVATE)}
          </Button>
        </InputWrapper>
      </div>
    </BillingPageWrapper>
  );
}
