import React from "react";
import type {
  Control,
  FormState,
  UseFormReset,
  UseFormHandleSubmit,
  UseFormSetValue,
  UseFormResetField,
} from "react-hook-form";
import { Controller } from "react-hook-form";
import { Button, Icon, NumberInput, Text, Tooltip } from "@appsmith/ads";

import type { Inputs } from "./BrandingPage";
import {
  ADMIN_BRANDING_LOGO_REQUIREMENT,
  ADMIN_BRANDING_FAVICON_REQUIREMENT,
  ADMIN_BRANDING_COLOR_TOOLTIP_BACKGROUND,
  ADMIN_BRANDING_COLOR_TOOLTIP_FONT,
  ADMIN_BRANDING_COLOR_TOOLTIP_PRIMARY,
  ADMIN_BRANDING_COLOR_TOOLTIP_HOVER,
  ADMIN_BRANDING_COLOR_TOOLTIP_DISABLED,
  ADMIN_BRANDING_COLOR_TOOLTIP,
  ADMIN_BRANDING_LOGO_SIZE_HELP,
  createMessage,
} from "ee/constants/messages";
import { ColorInput } from "pages/AdminSettings/FormGroup/ColorInput";
import { ImageInput } from "pages/AdminSettings/FormGroup/ImageInput";
import { logoImageValidator, faivconImageValidator } from "utils/BrandingUtils";
import { useBrandingForm } from "ee/pages/AdminSettings/Branding/useBrandingForm";
import AnalyticsUtil from "ee/utils/AnalyticsUtil";
import styled from "styled-components";
import { HelperText } from "pages/AdminSettings/components";
import { useFeatureFlag } from "utils/hooks/useFeatureFlag";
import { FEATURE_FLAG } from "ee/entities/FeatureFlag";

const Wrapper = styled.form`
  .help-icon {
    cursor: pointer;
  }
`;

const StyledText = styled(Text)`
  font-weight: var(--ads-v2-font-weight-bold);
`;

interface SettingsFormProps {
  disabled?: boolean;
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  control: Control<Inputs, any>;
  formState: FormState<Inputs>;
  handleSubmit: UseFormHandleSubmit<Inputs>;
  reset: UseFormReset<Inputs>;
  defaultValues: Inputs;
  setValue: UseFormSetValue<Inputs>;
  resetField: UseFormResetField<Inputs>;
  values: Inputs;
}

function SettingsForm(props: SettingsFormProps) {
  const { control, defaultValues, disabled, formState, handleSubmit } = props;
  const hasDirtyFields = Object.keys(formState.dirtyFields).length > 0;
  const { onSubmit } = useBrandingForm({
    dirtyFields: formState.dirtyFields,
  });
  const isLogoSizeEnabled = useFeatureFlag(
    FEATURE_FLAG.release_branding_logo_resize_enabled,
  );

  return (
    <Wrapper
      className="flex flex-col flex-grow gap-4"
      onSubmit={handleSubmit(onSubmit)}
    >
      {/* LOGO */}
      <div className="flex flex-col gap-2">
        <StyledText
          color="var(--ads-v2-color-fg)"
          htmlFor="brandLogo"
          kind="body-m"
          renderAs="label"
        >
          Logo
        </StyledText>
        <Controller
          control={control}
          name="brandLogo"
          render={({ field: { onChange, value } }) => (
            <ImageInput
              className="t--settings-brand-logo-input"
              defaultValue={defaultValues.brandLogo}
              onChange={(e) => {
                onChange && onChange(e);

                AnalyticsUtil.logEvent("BRANDING_PROPERTY_UPDATE", {
                  propertyName: "logo",
                });
              }}
              validate={logoImageValidator}
              value={value}
            />
          )}
        />
        <HelperText renderAs="p">
          * {createMessage(ADMIN_BRANDING_LOGO_REQUIREMENT)}
        </HelperText>
      </div>

      {/* LOGO DIMENSIONS */}
      {isLogoSizeEnabled && (
        <div className="flex flex-col gap-2">
          <StyledText
            color="var(--ads-v2-color-fg)"
            kind="body-m"
            renderAs="label"
          >
            Logo Dimensions
          </StyledText>
          <div className="flex flex-row lg:flex-col 2xl:flex-row gap-4">
            <div className="flex flex-col gap-1 flex-1">
              <Text
                color="var(--ads-v2-color-fg-muted)"
                htmlFor="logoWidth"
                kind="body-s"
                renderAs="label"
              >
                Width (px)
              </Text>
              <Controller
                control={control}
                name="logoWidth"
                render={({ field: { onChange, value } }) => (
                  <NumberInput
                    className="t--settings-brand-logo-width-input"
                    onChange={(val) => {
                      onChange(val ? parseInt(val, 10) : 160);
                      AnalyticsUtil.logEvent("BRANDING_PROPERTY_UPDATE", {
                        propertyName: "logoWidth",
                      });
                    }}
                    placeholder="160"
                    value={value?.toString() || ""}
                  />
                )}
              />
            </div>
            <div className="flex flex-col gap-1 flex-1">
              <Text
                color="var(--ads-v2-color-fg-muted)"
                htmlFor="logoHeight"
                kind="body-s"
                renderAs="label"
              >
                Height (px)
              </Text>
              <Controller
                control={control}
                name="logoHeight"
                render={({ field: { onChange, value } }) => (
                  <NumberInput
                    className="t--settings-brand-logo-height-input"
                    onChange={(val) => {
                      onChange(val ? parseInt(val, 10) : 24);
                      AnalyticsUtil.logEvent("BRANDING_PROPERTY_UPDATE", {
                        propertyName: "logoHeight",
                      });
                    }}
                    placeholder="24"
                    value={value?.toString() || ""}
                  />
                )}
              />
            </div>
          </div>
          <HelperText renderAs="p">
            {createMessage(ADMIN_BRANDING_LOGO_SIZE_HELP)}
          </HelperText>
        </div>
      )}

      {/* FAVICON */}
      <div className="flex flex-col gap-2">
        <StyledText
          color="var(--ads-v2-color-fg)"
          htmlFor="brandFavicon"
          kind="body-m"
          renderAs="label"
        >
          Favicon
        </StyledText>
        <Controller
          control={control}
          name="brandFavicon"
          render={({ field: { onChange, value } }) => (
            <ImageInput
              className="t--settings-brand-favicon-input"
              defaultValue={defaultValues.brandFavicon}
              onChange={(e) => {
                onChange && onChange(e);

                AnalyticsUtil.logEvent("BRANDING_PROPERTY_UPDATE", {
                  propertyName: "favicon",
                });
              }}
              validate={faivconImageValidator}
              value={value}
            />
          )}
        />
        <HelperText renderAs="p">
          * {createMessage(ADMIN_BRANDING_FAVICON_REQUIREMENT)}
        </HelperText>
      </div>

      {/* COLOR */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-1">
          <StyledText
            color="var(--ads-v2-color-fg)"
            htmlFor="APPSMITH_BRAND_PRIMARY_COLOR"
            kind="body-m"
            renderAs="label"
          >
            Color
          </StyledText>
          <Tooltip content={createMessage(ADMIN_BRANDING_COLOR_TOOLTIP)}>
            <Icon className="help-icon" name="question-line" size="md" />
          </Tooltip>
        </div>

        <Controller
          control={control}
          name="brandColors"
          render={({ field: { onChange, value } }) => (
            <ColorInput
              className="t--settings-brand-color-input"
              defaultValue={defaultValues.brandColors}
              filter={(key) => !["disabled", "hover", "active"].includes(key)}
              logEvent={(property: string) => {
                AnalyticsUtil.logEvent("BRANDING_PROPERTY_UPDATE", {
                  propertyName: property,
                });
              }}
              onChange={onChange}
              tooltips={{
                primary: createMessage(ADMIN_BRANDING_COLOR_TOOLTIP_PRIMARY),
                background: createMessage(
                  ADMIN_BRANDING_COLOR_TOOLTIP_BACKGROUND,
                ),
                hover: createMessage(ADMIN_BRANDING_COLOR_TOOLTIP_HOVER),
                font: createMessage(ADMIN_BRANDING_COLOR_TOOLTIP_FONT),
                disabled: createMessage(ADMIN_BRANDING_COLOR_TOOLTIP_DISABLED),
              }}
              value={value}
            />
          )}
        />
      </div>

      <Button
        className="t--settings-branding-submit-button"
        isDisabled={disabled || !hasDirtyFields}
        size="md"
        type="submit"
      >
        Submit
      </Button>
    </Wrapper>
  );
}

export default SettingsForm;
