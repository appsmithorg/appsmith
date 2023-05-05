export * from "ce/pages/Editor/NavigationSettings/LogoInput";
import React from "react";
import { ImageInput } from "../../../../pages/Editor/AppSettingsPane/AppSettings/NavigationSettings/ImageInput";
import { TextType, Text, TooltipComponent } from "design-system-old";
import {
  createMessage,
  APP_NAVIGATION_SETTING,
} from "@appsmith/constants/messages";
import type { UpdateSetting } from "../../../../pages/Editor/AppSettingsPane/AppSettings/NavigationSettings";
import { useDispatch, useSelector } from "react-redux";
import { getCurrentApplicationId } from "selectors/editorSelectors";
import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";
import type { NavigationSetting } from "constants/AppConstants";
import { logoImageValidation } from "../../../../pages/Editor/AppSettingsPane/AppSettings/NavigationSettings/utils";
import {
  getIsDeletingNavigationLogo,
  getIsUploadingNavigationLogo,
} from "@appsmith/selectors/applicationSelectors";
import { ReactComponent as ResetIcon } from "assets/icons/control/undo_2.svg";
import { getTenantConfig } from "@appsmith/selectors/tenantSelectors";
import { getAppsmithConfigs } from "@appsmith/configs";

export type ButtonGroupSettingProps = {
  updateSetting: UpdateSetting;
  navigationSetting: NavigationSetting;
};

export const { cloudHosting } = getAppsmithConfigs();

const LogoInput = ({ navigationSetting }: ButtonGroupSettingProps) => {
  const dispatch = useDispatch();
  const applicationId = useSelector(getCurrentApplicationId);
  const isUploadingNavigationLogo = useSelector(getIsUploadingNavigationLogo);
  const isDeletingNavigationLogo = useSelector(getIsDeletingNavigationLogo);
  const tenantConfig = useSelector(getTenantConfig);

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
        <Text type={TextType.P1}>
          {createMessage(APP_NAVIGATION_SETTING.logoLabel)}
        </Text>

        {navigationSetting?.logoAssetId?.length ? (
          <>
            <TooltipComponent
              content="Logo is different from the brand logo set."
              openOnTargetFocus={false}
            >
              <div className="ml-2 w-2 h-2 rounded-full bg-primary-500" />
            </TooltipComponent>

            <button
              className="flex items-center justify-center text-center h-7 w-7 ml-auto"
              disabled={isUploadingNavigationLogo || isDeletingNavigationLogo}
              onClick={() => handleDelete()}
            >
              <TooltipComponent
                boundary="viewport"
                content="Reset logo"
                openOnTargetFocus={false}
                position="top-right"
              >
                <ResetIcon className="w-5 h-5" />
              </TooltipComponent>
            </button>
          </>
        ) : (
          ""
        )}
      </div>
      <div className="pt-1">
        <ImageInput
          className="t--settings-brand-logo-input"
          onChange={(file) => {
            handleChange && handleChange(file);
          }}
          validate={logoImageValidation}
          value={
            navigationSetting?.logoAssetId
              ? `/api/v1/assets/${navigationSetting?.logoAssetId}`
              : !cloudHosting
              ? tenantConfig.brandLogoUrl
              : ""
          }
        />
      </div>
    </div>
  );
};

export default LogoInput;
