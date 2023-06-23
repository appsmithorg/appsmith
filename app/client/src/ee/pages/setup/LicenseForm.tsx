import React, { useEffect, useState } from "react";
import {
  showLicenseModal,
  validateLicense,
} from "@appsmith/actions/tenantActions";
import { useForm } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import {
  REQUIRED_LICENSE_KEY,
  ADD_KEY,
  ACTIVATE_INSTANCE,
  createMessage,
  SUBMIT_BUTTON,
  CANCEL,
  LICENSE_FORM_DESCIPTION,
} from "@appsmith/constants/messages";
import {
  hasInvalidLicenseKeyError,
  isLicenseValidating,
} from "@appsmith/selectors/tenantSelectors";
import { isEmptyString } from "utils/formhelpers";
import { StyledForm, StyledInput, InputWrapper } from "./styles";
import { Button, Text, toast } from "design-system";
import { getFirstTimeUserOnboardingTelemetryCalloutIsAlreadyShown } from "utils/storage";

export type LicenseFormProps = {
  label?: string;
  placeholder?: string;
  actionBtnText?: string;
  isModal?: boolean;
};

export const LicenseForm = (props: LicenseFormProps) => {
  const urlParams = new URLSearchParams(window.location.search);
  const myParam = urlParams.get("error");
  if (myParam) {
    toast.show(myParam, { kind: "error" });
  }
  const { actionBtnText, isModal, label, placeholder } = props;
  const dispatch = useDispatch();
  const isInvalid = useSelector(hasInvalidLicenseKeyError);
  const licenseValidating = useSelector(isLicenseValidating);
  const {
    formState: { errors },
    getFieldState,
    getValues,
    handleSubmit,
    register,
    setError,
  } = useForm();

  const isFieldTouched = getFieldState("licenseKey").isTouched;
  const [isFieldEmpty, setIsFieldEmpty] = useState(true);
  const [isUserOnboarding, setUserOnboarding] = useState(false);

  useEffect(() => {
    const values = getValues();

    if (
      isFieldTouched &&
      isInvalid &&
      !isEmptyString(values?.licenseKey) &&
      !licenseValidating
    ) {
      setError("licenseKey", {
        type: "invalid",
      });
    }
  }, [isInvalid, isFieldTouched, errors, licenseValidating]);

  useEffect(() => {
    const isOnboardingCompleted = async () => {
      const isFirstTimeUserOnboarding =
        await getFirstTimeUserOnboardingTelemetryCalloutIsAlreadyShown();
      //false if the user is onboarding
      //true if the user is not onboarding
      //undefined if the user is using a different browser
      if (isFirstTimeUserOnboarding === false) {
        setUserOnboarding(true);
      }
    };
    isOnboardingCompleted();
  }, []);

  const checkLicenseStatus = (formValues: any) => {
    const { licenseKey } = formValues;

    if (isEmptyString(licenseKey)) {
      setError("licenseKey", {
        type: "required",
        message: createMessage(REQUIRED_LICENSE_KEY),
      });
    }

    if (licenseKey) {
      dispatch(validateLicense(licenseKey, isUserOnboarding));
    }
  };

  const handleInputChange = (value: string) => {
    if (isEmptyString(value)) {
      setIsFieldEmpty(true);
    } else {
      setIsFieldEmpty(false);
    }
  };

  const formError = errors?.licenseKey?.type ? true : false;
  return (
    <StyledForm
      className={`license-form`}
      onSubmit={handleSubmit(checkLicenseStatus)}
      showError={formError}
    >
      <InputWrapper>
        <StyledInput
          className={`license-input`}
          data-testid="t--license-input"
          description={isModal ? createMessage(LICENSE_FORM_DESCIPTION) : ""}
          label={label}
          placeholder={placeholder ?? createMessage(ADD_KEY)}
          {...register("licenseKey")}
          onChange={handleInputChange}
          size="md"
        />
        {errors.licenseKey && (
          <Text
            className="input-error-msg"
            color="var(--ads-v2-color-fg-error)"
            renderAs="p"
          >
            {errors.licenseKey.message}
          </Text>
        )}
      </InputWrapper>
      {isModal ? (
        <div className="flex justify-end gap-2">
          <Button
            data-testid="t--activate-instance-cancel-btn "
            kind="secondary"
            onClick={() => dispatch(showLicenseModal(false))}
            size="md"
            type="button"
          >
            {createMessage(CANCEL)}
          </Button>
          <Button
            data-testid="t--activate-instance-submit-btn"
            isDisabled={isFieldEmpty}
            isLoading={licenseValidating}
            size="md"
            type="submit"
          >
            {createMessage(SUBMIT_BUTTON)}
          </Button>
        </div>
      ) : (
        <Button
          data-testid="t--activate-instance-btn"
          isDisabled={isFieldEmpty}
          isLoading={licenseValidating}
          size="md"
          type="submit"
        >
          {actionBtnText ?? createMessage(ACTIVATE_INSTANCE)}
        </Button>
      )}
    </StyledForm>
  );
};
