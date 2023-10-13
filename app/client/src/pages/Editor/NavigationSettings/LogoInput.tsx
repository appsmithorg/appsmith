import React, { useEffect, useState } from "react";
import { ImageInput } from "pages/Editor/AppSettingsPane/AppSettings/NavigationSettings/ImageInput";
import { Text } from "design-system";
import {
  createMessage,
  APP_NAVIGATION_SETTING,
} from "@appsmith/constants/messages";
import type { UpdateSetting } from "pages/Editor/AppSettingsPane/AppSettings/NavigationSettings";
import { useDispatch, useSelector } from "react-redux";
import { getCurrentApplicationId } from "selectors/editorSelectors";
import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";
import type { NavigationSetting } from "constants/AppConstants";
import { logoImageValidation } from "pages/Editor/AppSettingsPane/AppSettings/NavigationSettings/utils";
import {
  getIsDeletingNavigationLogo,
  getIsUploadingNavigationLogo,
} from "@appsmith/selectors/applicationSelectors";
import { getTenantConfig } from "@appsmith/selectors/tenantSelectors";
import { getAppsmithConfigs } from "@appsmith/configs";
import { DeleteLogoButton } from "@appsmith/pages/Editor/NavigationSettings/DeleteLogoButton";

export interface ButtonGroupSettingProps {
  updateSetting: UpdateSetting;
  navigationSetting: NavigationSetting;
}

export const { cloudHosting } = getAppsmithConfigs();

const LogoInput = ({ navigationSetting }: ButtonGroupSettingProps) => {
  const dispatch = useDispatch();
  const applicationId = useSelector(getCurrentApplicationId);
  const isUploadingNavigationLogo = useSelector(getIsUploadingNavigationLogo);
  const isDeletingNavigationLogo = useSelector(getIsDeletingNavigationLogo);
  const tenantConfig = useSelector(getTenantConfig);
  const { logoAssetId } = navigationSetting;
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  useEffect(() => {
    if (logoAssetId?.length) {
      setLogoUrl(`/api/v1/assets/${logoAssetId}`);
      return;
    } else if (cloudHosting) {
      setLogoUrl(null);
      return;
    } else if (!cloudHosting && tenantConfig?.brandLogoUrl) {
      setLogoUrl(tenantConfig.brandLogoUrl);
      return;
    }

    setLogoUrl(null);
    return;
  }, [logoAssetId, tenantConfig, cloudHosting]);

  const handleChange = (file: File) => {
    dispatch({
      type: ReduxActionTypes.UPLOAD_NAVIGATION_LOGO_INIT,
      payload: {
        applicationId: applicationId,
        logo: file,
      },
    });
  };

  const handleDelete = () => {
    dispatch({
      type: ReduxActionTypes.DELETE_NAVIGATION_LOGO_INIT,
      payload: {
        applicationId: applicationId,
      },
    });
  };

  return (
    <div className={`pt-4 t--navigation-settings-logo`}>
      <div className="flex items-center">
        <Text kind="action-m">
          {createMessage(APP_NAVIGATION_SETTING.logoLabel)}
        </Text>

        {navigationSetting?.logoAssetId?.length ? (
          <DeleteLogoButton
            handleDelete={handleDelete}
            isDeletingNavigationLogo={isDeletingNavigationLogo}
            isUploadingNavigationLogo={isUploadingNavigationLogo}
          />
        ) : null}
      </div>
      <div className="pt-1">
        <ImageInput
          className="t--settings-brand-logo-input"
          onChange={(file) => {
            handleChange && handleChange(file);
          }}
          validate={logoImageValidation}
          value={logoUrl}
        />
      </div>
    </div>
  );
};

export default LogoInput;
