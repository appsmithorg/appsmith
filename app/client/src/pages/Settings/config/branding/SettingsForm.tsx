import React from "react";
import {
  Control,
  Controller,
  FormState,
  UseFormReset,
  UseFormHandleSubmit,
  UseFormSetValue,
  UseFormResetField,
} from "react-hook-form";
import { Button, Size, TooltipComponent } from "design-system";

import { Inputs } from "./BrandingPage";
import {
  ADMIN_BRANDING_SETTINGS_UPGRADE_TEXT,
  ADMIN_BRANDING_LOGO_REQUIREMENT,
  ADMIN_BRANDING_FAVICON_REQUIREMENT,
  ADMIN_BRANDING_COLOR_TOOLTIP_BACKGROUND,
  ADMIN_BRANDING_COLOR_TOOLTIP_FONT,
  ADMIN_BRANDING_COLOR_TOOLTIP_PRIMARY,
  ADMIN_BRANDING_COLOR_TOOLTIP_HOVER,
  ADMIN_BRANDING_COLOR_TOOLTIP_DISABLED,
  createMessage,
} from "@appsmith/constants/messages";
import { ColorInput } from "pages/Settings/FormGroup/ColorInput";
import { ImageInput } from "pages/Settings/FormGroup/ImageInput";
import ArrowGoBackIcon from "remixicon-react/ArrowGoBackFillIcon";
import { logoImageValidator, faivconImageValidator } from "utils/BrandingUtils";
import { useBrandingForm } from "@appsmith/pages/AdminSettings/config/branding/useBrandingForm";

type SettingsFormProps = {
  disabled?: boolean;
  control: Control<Inputs, any>;
  formState: FormState<Inputs>;
  handleSubmit: UseFormHandleSubmit<Inputs>;
  reset: UseFormReset<Inputs>;
  defaultValues: Inputs;
  setValue: UseFormSetValue<Inputs>;
  resetField: UseFormResetField<Inputs>;
};

function SettingsForm(props: SettingsFormProps) {
  const { control, disabled, formState, handleSubmit, resetField } = props;
  const hasDirtyFields = Object.keys(formState.dirtyFields).length > 0;
  const { onSubmit } = useBrandingForm({
    dirtyFields: formState.dirtyFields,
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="flex flex-col flex-grow gap-4">
        {/* LOGO */}
        <div className="flex flex-col gap-2">
          <label className="font-semibold" htmlFor="APPSMITH_BRAND_LOGO">
            Logo
          </label>
          <Controller
            control={control}
            name="APPSMITH_BRAND_LOGO"
            render={({ field: { onChange, value } }) => (
              <ImageInput
                className="t--settings-brand-logo-input"
                onChange={onChange}
                validate={logoImageValidator}
                value={value}
              />
            )}
          />
          <p className="text-gray-500">
            {createMessage(ADMIN_BRANDING_LOGO_REQUIREMENT)}
          </p>
        </div>

        {/* FAVICON */}
        <div className="flex flex-col gap-2">
          <label className="font-semibold" htmlFor="APPSMITH_BRAND_FAVICON">
            Favicon
          </label>
          <Controller
            control={control}
            name="APPSMITH_BRAND_FAVICON"
            render={({ field: { onChange, value } }) => (
              <ImageInput
                className="t--settings-brand-favicon-input"
                onChange={onChange}
                validate={faivconImageValidator}
                value={value}
              />
            )}
          />
          <p className="text-gray-500">
            {createMessage(ADMIN_BRANDING_FAVICON_REQUIREMENT)}
          </p>
        </div>

        {/* COLOR */}
        <div className="flex flex-col gap-2">
          <div className="flex justify-between">
            <label
              className="font-semibold"
              htmlFor="APPSMITH_BRAND_PRIMARY_COLOR"
            >
              Color
            </label>
            {hasDirtyFields && (
              <TooltipComponent content="Reset colors">
                <button
                  className="text-gray-500 hover:text-gray-700"
                  onClick={() => resetField("brandColors")}
                  type="button"
                >
                  <ArrowGoBackIcon className="w-4 h-4" />
                </button>
              </TooltipComponent>
            )}
          </div>
          <Controller
            control={control}
            name="brandColors"
            render={({ field: { onChange, value } }) => (
              <ColorInput
                className="t--settings-brand-color-input"
                filter={(key) => !["disabled", "hover"].includes(key)}
                onChange={onChange}
                tooltips={{
                  primary: createMessage(ADMIN_BRANDING_COLOR_TOOLTIP_PRIMARY),
                  background: createMessage(
                    ADMIN_BRANDING_COLOR_TOOLTIP_BACKGROUND,
                  ),
                  hover: createMessage(ADMIN_BRANDING_COLOR_TOOLTIP_HOVER),
                  font: createMessage(ADMIN_BRANDING_COLOR_TOOLTIP_FONT),
                  disabled: createMessage(
                    ADMIN_BRANDING_COLOR_TOOLTIP_DISABLED,
                  ),
                }}
                value={value}
              />
            )}
          />
        </div>

        <TooltipComponent
          content={createMessage(ADMIN_BRANDING_SETTINGS_UPGRADE_TEXT)}
          disabled={!disabled}
        >
          <Button
            disabled={disabled || !hasDirtyFields}
            size={Size.medium}
            tag="button"
            text="submit"
            type="submit"
          />
        </TooltipComponent>
      </div>
    </form>
  );
}

export default SettingsForm;
