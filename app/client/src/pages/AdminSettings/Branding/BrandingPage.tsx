import React, { useEffect } from "react";
import { useSelector } from "react-redux";
import { useForm } from "react-hook-form";

import Previews from "./previews";
import SettingsForm from "./SettingsForm";
import { getOrganizationConfig } from "ee/selectors/organizationSelectors";
import { Wrapper } from "pages/AdminSettings/Authentication/AuthPage";

import { getAssetUrl } from "ee/utils/airgapHelpers";
import type { AdminConfigType } from "ee/pages/AdminSettings/config/types";
import { getUpgradeBanner } from "ee/utils/BusinessFeatures/brandingPageHelpers";

export type brandColorsKeys =
  | "primary"
  | "background"
  | "font"
  | "hover"
  | "disabled";

export interface Inputs {
  brandColors: Record<brandColorsKeys, string>;
  brandLogo: string;
  brandFavicon: string;
}

interface BrandingPageProps {
  category: AdminConfigType;
}

function BrandingPage(props: BrandingPageProps) {
  const { category } = props;
  const isBrandingEnabled = category?.isFeatureEnabled ?? false;
  const organizationConfig = useSelector(getOrganizationConfig);
  const defaultValues = {
    brandColors: organizationConfig.brandColors,
    brandLogo: organizationConfig.brandLogoUrl,
    brandFavicon: organizationConfig.brandFaviconUrl,
  };
  const {
    control,
    formState,
    getValues,
    handleSubmit,
    reset,
    resetField,
    setValue,
    watch,
  } = useForm<Inputs>({
    defaultValues,
  });

  const values = getValues();

  /**
   * reset the form when the organization config changes
   */
  useEffect(() => {
    reset({
      brandColors: organizationConfig.brandColors,
      brandLogo: organizationConfig.brandLogoUrl,
      brandFavicon: organizationConfig.brandFaviconUrl,
    });
  }, [organizationConfig, reset]);

  watch();

  return (
    <Wrapper>
      {getUpgradeBanner(isBrandingEnabled)}
      <div className="grid md:grid-cols-[1fr] lg:grid-cols-[max(300px,30%)_1fr] gap-8 mt-4 pr-7">
        <SettingsForm
          control={control}
          defaultValues={defaultValues}
          disabled={!isBrandingEnabled}
          formState={formState}
          handleSubmit={handleSubmit}
          reset={reset}
          resetField={resetField}
          setValue={setValue}
          values={values}
        />
        <div className="flex-grow">
          <Previews
            favicon={getAssetUrl(values.brandFavicon)}
            logo={getAssetUrl(values.brandLogo)}
            shades={values.brandColors}
          />
        </div>
      </div>
    </Wrapper>
  );
}

export default BrandingPage;
