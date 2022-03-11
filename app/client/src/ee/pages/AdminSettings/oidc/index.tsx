import React, { useEffect } from "react";
import { saveSettings } from "actions/settingsAction";
import { SETTINGS_FORM_NAME } from "constants/forms";
import _ from "lodash";
import { connect, useDispatch } from "react-redux";
import { RouteComponentProps, useParams, withRouter } from "react-router";
import { AppState } from "reducers";
import { formValueSelector, InjectedFormProps, reduxForm } from "redux-form";
import {
  getSettings,
  getSettingsSavingState,
} from "selectors/settingsSelectors";
import styled from "styled-components";
import Group from "pages/Settings/FormGroup/group";
import { DisconnectService } from "pages/Settings/DisconnectService";
import RestartBanner from "pages/Settings/RestartBanner";
import AdminConfig from "pages/Settings/config";
import SaveAdminSettings from "pages/Settings/SaveSettings";
import {
  SettingTypes,
  Setting,
} from "@appsmith/pages/AdminSettings/config/types";
import {
  createMessage,
  DISCONNECT_SERVICE_SUBHEADER,
  DISCONNECT_SERVICE_WARNING,
} from "@appsmith/constants/messages";
import { Toaster, Variant } from "components/ads";
import {
  connectedMethods,
  saveAllowed,
} from "@appsmith/utils/adminSettingsHelpers";

const Wrapper = styled.div`
  flex-basis: calc(100% - ${(props) => props.theme.homePage.leftPane.width}px);
  margin-left: ${(props) => props.theme.homePage.main.marginLeft}px;
  padding-top: 40px;
  height: calc(100vh - ${(props) => props.theme.homePage.header}px);
  overflow: auto;
`;

const SettingsFormWrapper = styled.div`
  max-width: 40rem;
`;

export const BottomSpace = styled.div`
  height: ${(props) => props.theme.settings.footerHeight + 20}px;
`;

export const HeaderWrapper = styled.div`
  margin-bottom: 16px;
`;

export const SettingsHeader = styled.h2`
  font-size: 24px;
  font-weight: 500;
  text-transform: capitalize;
  margin-bottom: 0px;
`;

export const SettingsSubHeader = styled.div`
  font-size: 12px;
`;

type FormProps = {
  settings: Record<string, string>;
  settingsConfig: Record<string, string | boolean>;
  isSaving: boolean;
};

function getSettingLabel(name = "") {
  return name.replace(/-/g, "");
}

function getSettingDetail(category: string, subCategory: string) {
  return AdminConfig.getCategoryDetails(category, subCategory);
}

function useSettings(category: string, subCategory?: string) {
  return AdminConfig.get(subCategory ?? category);
}

export function OidcSettingsForm(
  props: InjectedFormProps & RouteComponentProps & FormProps,
) {
  const params = useParams() as any;
  const { category, subCategory } = params;
  const settings = useSettings(category, subCategory);
  const details = getSettingDetail(category, subCategory);
  const dispatch = useDispatch();
  const isSavable = AdminConfig.savableCategories.includes(
    subCategory ?? category,
  );
  const pageTitle = getSettingLabel(
    details?.title || (subCategory ?? category),
  );

  const onSave = () => {
    if (saveAllowed(props.settings)) {
      dispatch(saveSettings(props.settings));
    } else {
      saveBlocked();
    }
  };

  const onClear = () => {
    _.forEach(props.settingsConfig, (value, settingName) => {
      const setting = AdminConfig.settingsMap[settingName];
      if (setting && setting.controlType == SettingTypes.TOGGLE) {
        props.settingsConfig[settingName] =
          props.settingsConfig[settingName].toString() == "true";

        const scopeSettings =
            props.settingsConfig["APPSMITH_OAUTH2_OIDC_SCOPE"],
          oidcUsernameSettings =
            props.settingsConfig["APPSMITH_OAUTH2_OIDC_USERNAME_ATTRIBUTE"];

        if (
          typeof scopeSettings === "undefined" ||
          (typeof scopeSettings === "string" && scopeSettings.trim() === "")
        ) {
          props.settingsConfig["APPSMITH_OAUTH2_OIDC_SCOPE"] = "openid,profile";
        }

        if (
          typeof oidcUsernameSettings === "undefined" ||
          oidcUsernameSettings === ""
        ) {
          props.settingsConfig["APPSMITH_OAUTH2_OIDC_USERNAME_ATTRIBUTE"] =
            "email";
        }
      }
    });
    props.initialize(props.settingsConfig);
  };

  useEffect(onClear, []);

  const saveBlocked = () => {
    Toaster.show({
      text: "Cannot disconnect the only connected authentication method.",
      variant: Variant.danger,
    });
  };

  const disconnect = (currentSettings: AdminConfig) => {
    const updatedSettings: any = {};
    if (connectedMethods.length >= 2) {
      _.forEach(currentSettings, (setting: Setting) => {
        if (
          !setting.isHidden &&
          [
            SettingTypes.LINK,
            SettingTypes.ACCORDION,
            SettingTypes.UNEDITABLEFIELD,
          ].indexOf(setting.controlType) === -1
        ) {
          updatedSettings[setting.id] = "";
        }
        if (setting.controlType === SettingTypes.ACCORDION) {
          _.forEach(setting.advanced, (subSetting: Setting) => {
            if (!subSetting.isHidden) {
              updatedSettings[subSetting.id] = "";
            }
          });
        }
      });
      dispatch(saveSettings(updatedSettings));
    } else {
      saveBlocked();
    }
  };

  return (
    <Wrapper>
      <SettingsFormWrapper>
        <HeaderWrapper>
          <SettingsHeader>{pageTitle}</SettingsHeader>
          {details?.subText && (
            <SettingsSubHeader>{details.subText}</SettingsSubHeader>
          )}
        </HeaderWrapper>
        <Group
          category={category}
          settings={settings}
          subCategory={subCategory}
        />
        {isSavable && (
          <SaveAdminSettings
            isSaving={props.isSaving}
            onClear={onClear}
            onSave={onSave}
            settings={props.settings}
            valid={props.valid}
          />
        )}
        {details?.isConnected && (
          <DisconnectService
            disconnect={() => disconnect(settings)}
            subHeader={createMessage(DISCONNECT_SERVICE_SUBHEADER)}
            warning={`${pageTitle} ${createMessage(
              DISCONNECT_SERVICE_WARNING,
            )}`}
          />
        )}
        <BottomSpace />
      </SettingsFormWrapper>
      <RestartBanner />
    </Wrapper>
  );
}

const validate = (values: Record<string, any>) => {
  const errors: any = {};
  _.filter(values, (value, name) => {
    const err_message = AdminConfig.validate(name, value);
    if (err_message) {
      errors[name] = err_message;
    }
  });
  return errors;
};

const selector = formValueSelector(SETTINGS_FORM_NAME);
export default withRouter(
  connect((state: AppState) => {
    const settingsConfig = getSettings(state);
    const newProps: any = {
      settings: {},
      settingsConfig,
      isSaving: getSettingsSavingState(state),
    };
    _.forEach(AdminConfig.settingsMap, (setting, name) => {
      const fieldValue = selector(state, name);

      if (fieldValue !== settingsConfig[name]) {
        newProps.settings[name] = fieldValue;
      }
    });
    return newProps;
  }, null)(
    reduxForm<any, any>({
      validate,
      form: SETTINGS_FORM_NAME,
      touchOnBlur: true,
    })(OidcSettingsForm),
  ),
);
