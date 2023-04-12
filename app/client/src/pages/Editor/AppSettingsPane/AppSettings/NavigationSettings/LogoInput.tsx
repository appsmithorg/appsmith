import React from "react";
import { ImageInput } from "./ImageInput";
import { TextType, Text } from "design-system-old";
import {
  createMessage,
  APP_NAVIGATION_SETTING,
} from "@appsmith/constants/messages";
import type { UpdateSetting } from ".";
import { useDispatch, useSelector } from "react-redux";
import { getCurrentApplicationId } from "selectors/editorSelectors";
import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";
import type { NavigationSetting } from "constants/AppConstants";
import { logoImageValidation } from "./utils";

export type ButtonGroupSettingProps = {
  updateSetting: UpdateSetting;
  navigationSetting: NavigationSetting;
};

const LogoInput = ({ navigationSetting }: ButtonGroupSettingProps) => {
  const dispatch = useDispatch();
  const applicationId = useSelector(getCurrentApplicationId);

  const handleChange = (file: File) => {
    dispatch({
      type: ReduxActionTypes.UPLOAD_NAVIGATION_LOGO_INIT,
      payload: {
        applicationId: applicationId,
        logo: file,
      },
    });
  };

  return (
    <div className={`pt-4 t--navigation-settings-logo`}>
      <Text type={TextType.P1}>
        {createMessage(APP_NAVIGATION_SETTING.logoLabel)}
      </Text>
      <div className="pt-1">
        <ImageInput
          className="t--settings-brand-logo-input"
          onChange={(file) => {
            handleChange && handleChange(file);
          }}
          validate={logoImageValidation}
          value={navigationSetting?.logoAssetId}
        />
      </div>
    </div>
  );
};

export default LogoInput;
