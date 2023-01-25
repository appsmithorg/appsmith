import React, { useEffect } from "react";
import {
  Category,
  Icon,
  IconSize,
  Size,
  Text,
  TextType,
} from "design-system-old";
import AppsmithImage from "assets/images/appsmith_logo_square.png";
import { validateLicense } from "@appsmith/actions/tenantActions";
import { useDispatch, useSelector } from "react-redux";
import { isEmptyString } from "utils/formhelpers";
import { useForm } from "react-hook-form";
import {
  createMessage,
  ACTIVATE_INSTANCE,
  ADD_KEY,
  GET_STARTED_MESSAGE,
  GET_TRIAL_LICENSE,
  INVALID_LICENSE_KEY,
  LICENSE_KEY_CTA_LABEL,
  LICENSE_KEY_FORM_INPUT_LABEL,
  NO_ACTIVE_SUBSCRIPTION,
  REQUIRED_LICENSE_KEY,
} from "@appsmith/constants/messages";
import { goToCustomerPortal } from "@appsmith/utils/billingUtils";
import {
  StyledPageWrapper,
  StyledBannerWrapper,
  StyledCardWrapper,
  StyledInput,
  StyledContent,
  StyledButton,
  StyledCard,
  StyledForm,
  InputWrapper,
  IconBadge,
} from "./styles";
import { requiresAuth } from "pages/UserAuth/requiresAuthHOC";
import {
  isValidLicense,
  isTenantLoading,
} from "@appsmith/selectors/tenantSelectors";

function LicenseCheckPage() {
  const dispatch = useDispatch();
  const isValid = useSelector(isValidLicense);
  const isLoading = useSelector(isTenantLoading);
  const {
    formState: { errors },
    getFieldState,
    getValues,
    handleSubmit,
    register,
    setError,
  } = useForm();

  const isFieldTouched = getFieldState("licenseKey").isTouched;

  useEffect(() => {
    const values = getValues();

    if (isFieldTouched && !isValid && !isEmptyString(values?.licenseKey)) {
      setError("licenseKey", {
        type: "invalid",
        message: createMessage(INVALID_LICENSE_KEY),
      });
    }
  }, [isValid, isFieldTouched, errors]);

  const checkLicenseStatus = (formValues: any) => {
    const { licenseKey } = formValues;

    if (isEmptyString(licenseKey)) {
      setError("licenseKey", {
        type: "required",
        message: createMessage(REQUIRED_LICENSE_KEY),
      });
    }

    if (licenseKey) {
      dispatch(validateLicense(licenseKey));
    }
  };

  const formError = errors?.licenseKey?.message ? true : false;

  return (
    <StyledPageWrapper>
      <StyledBannerWrapper>
        <img
          alt={createMessage(NO_ACTIVE_SUBSCRIPTION)}
          className="no-sub-img"
          height="657"
          src={AppsmithImage}
          width="177"
        />
        <Text type={TextType.H1} weight="600">
          {createMessage(NO_ACTIVE_SUBSCRIPTION)}
        </Text>
        <Text type={TextType.P1}>{createMessage(GET_STARTED_MESSAGE)}</Text>
      </StyledBannerWrapper>
      <StyledCardWrapper>
        <StyledCard>
          <IconBadge>
            <Icon name="key-2-line" size={IconSize.XXXXL} />
          </IconBadge>
          <StyledForm
            className={`license-form`}
            onSubmit={handleSubmit(checkLicenseStatus)}
            showError={formError}
          >
            <label className="license-input-label">
              {createMessage(LICENSE_KEY_FORM_INPUT_LABEL)}
            </label>
            <InputWrapper>
              <StyledInput
                className={`license-input `}
                placeholder={createMessage(ADD_KEY)}
                {...register("licenseKey")}
              />
              {errors.licenseKey && !isLoading && (
                <Text className="input-error-msg" type={TextType.P3}>
                  {errors.licenseKey.message}
                </Text>
              )}
            </InputWrapper>
            <StyledButton
              fill
              isLoading={isLoading}
              size={Size.large}
              tag="button"
              text={createMessage(ACTIVATE_INSTANCE)}
              type="submit"
            />
          </StyledForm>
        </StyledCard>
        <StyledCard noField>
          <IconBadge>
            <Icon name="arrow-right-up-line" size={IconSize.XXXXL} />
          </IconBadge>
          <StyledContent>{createMessage(LICENSE_KEY_CTA_LABEL)}</StyledContent>
          <StyledButton
            category={Category.secondary}
            icon="share-2"
            iconPosition="left"
            onClick={goToCustomerPortal}
            size={Size.large}
            tag="button"
            text={createMessage(GET_TRIAL_LICENSE)}
            type="button"
          />
        </StyledCard>
      </StyledCardWrapper>
    </StyledPageWrapper>
  );
}

export default requiresAuth(LicenseCheckPage);
