import React, { useEffect, useState } from "react";
import { saveSettings } from "@appsmith/actions/settingsAction";
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
import AdminConfig from "@appsmith/pages/AdminSettings/config";
import SaveAdminSettings from "pages/Settings/SaveSettings";
import {
  SettingTypes,
  Setting,
} from "@appsmith/pages/AdminSettings/config/types";
import {
  createMessage,
  DISCONNECT_AUTH_ERROR,
  DISCONNECT_SERVICE_SUBHEADER,
  DISCONNECT_SERVICE_WARNING,
  MANDATORY_FIELDS_ERROR,
} from "@appsmith/constants/messages";
import { Toaster, Variant } from "components/ads";
import {
  connectedMethods,
  saveAllowed,
} from "@appsmith/utils/adminSettingsHelpers";
import { Classes } from "@blueprintjs/core";
import AnalyticsUtil from "utils/AnalyticsUtil";

const Wrapper = styled.div`
  flex-basis: calc(100% - ${(props) => props.theme.homePage.leftPane.width}px);
  margin-left: ${(props) => props.theme.homePage.main.marginLeft}px;
  padding-top: 40px;
  height: calc(100vh - ${(props) => props.theme.homePage.header}px);
  overflow: auto;
`;

const SettingsFormWrapper = styled.div`
  max-width: 40rem;

  .openid_tag {
    .${Classes.TAG_REMOVE} {
      display: none;
    }
  }
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

function getSettingsConfig(category: string, subCategory?: string) {
  return AdminConfig.get(subCategory ?? category);
}

export function OidcSettingsForm(
  props: InjectedFormProps & RouteComponentProps & FormProps,
) {
  const [defaultSettings, setDefaultSettings] = useState<string[]>([]);
  const params = useParams() as any;
  const { category, subCategory } = params;
  const settingsDetails = getSettingsConfig(category, subCategory);
  const { settings, settingsConfig } = props;
  const details = getSettingDetail(category, subCategory);
  const dispatch = useDispatch();
  const isSavable = AdminConfig.savableCategories.includes(
    subCategory ?? category,
  );
  const pageTitle = getSettingLabel(
    details?.title || (subCategory ?? category),
  );

  const onSave = () => {
    if (checkMandatoryFileds()) {
      if (saveAllowed(props.settings)) {
        AnalyticsUtil.logEvent("ADMIN_SETTINGS_SAVE", {
          method: pageTitle,
        });
        _.forEach(defaultSettings, (name) => {
          if (!props.settings[name]) {
            props.settings[name] = props.settingsConfig[name].toString();
          }
        });
        dispatch(saveSettings(props.settings));
      } else {
        saveBlocked();
      }
    } else {
      AnalyticsUtil.logEvent("ADMIN_SETTINGS_ERROR", {
        error: createMessage(MANDATORY_FIELDS_ERROR),
      });
      Toaster.show({
        text: createMessage(MANDATORY_FIELDS_ERROR),
        variant: Variant.danger,
      });
    }
  };

  const checkMandatoryFileds = () => {
    const requiredFields = settingsDetails.filter((eachSetting) => {
      const isInitialSettingBlank =
        settingsConfig[eachSetting.id]?.toString().trim() === "" ||
        settingsConfig[eachSetting.id] === undefined;
      const isInitialSettingNotBlank = settingsConfig[eachSetting.id];
      const isNewSettingBlank =
        settings[eachSetting.id]?.toString()?.trim() === "";
      const isNewSettingNotBlank = !settings[eachSetting.id];

      if (
        eachSetting.isRequired &&
        !eachSetting.isHidden &&
        ((isInitialSettingBlank && isNewSettingNotBlank) ||
          (isInitialSettingNotBlank && isNewSettingBlank))
      ) {
        return eachSetting.id;
      }
    });

    return !(requiredFields.length > 0);
  };

  const onClear = (event?: React.FocusEvent<any, any>) => {
    if (event?.type === "click") {
      AnalyticsUtil.logEvent("ADMIN_SETTINGS_RESET", {
        method: pageTitle,
      });
    }
    _.forEach(props.settingsConfig, (value, settingName) => {
      const setting = AdminConfig.settingsMap[settingName];
      if (setting && setting.controlType == SettingTypes.TOGGLE) {
        props.settingsConfig[settingName] =
          props.settingsConfig[settingName].toString() == "true";
      }

      const scopeConfigSettings =
          props.settingsConfig["APPSMITH_OAUTH2_OIDC_SCOPE"],
        userAttriConfigSettings =
          props.settingsConfig["APPSMITH_OAUTH2_OIDC_USERNAME_ATTRIBUTE"],
        scopeSettings = props.settings["APPSMITH_OAUTH2_OIDC_SCOPE"],
        userAttriSettings =
          props.settings["APPSMITH_OAUTH2_OIDC_USERNAME_ATTRIBUTE"];

      if (
        !(
          scopeConfigSettings?.toString().trim() ||
          scopeSettings?.toString().trim()
        ) ||
        (typeof scopeSettings === "string" && !scopeSettings.trim())
      ) {
        props.settingsConfig["APPSMITH_OAUTH2_OIDC_SCOPE"] =
          "openid,profile,email";
        setDefaultSettings((oldDefaultSettings) => [
          ...oldDefaultSettings,
          "APPSMITH_OAUTH2_OIDC_SCOPE",
        ]);
      }

      if (
        !(
          userAttriConfigSettings?.toString().trim() ||
          userAttriSettings?.toString().trim()
        ) ||
        (typeof userAttriSettings === "string" && !userAttriSettings.trim())
      ) {
        props.settingsConfig["APPSMITH_OAUTH2_OIDC_USERNAME_ATTRIBUTE"] =
          "email";
        setDefaultSettings((oldDefaultSettings) => [
          ...oldDefaultSettings,
          "APPSMITH_OAUTH2_OIDC_USERNAME_ATTRIBUTE",
        ]);
      }
    });
    props.initialize(props.settingsConfig);
  };

  useEffect(onClear, []);

  const saveBlocked = () => {
    AnalyticsUtil.logEvent("ADMIN_SETTINGS_ERROR", {
      error: createMessage(DISCONNECT_AUTH_ERROR),
    });
    Toaster.show({
      text: createMessage(DISCONNECT_AUTH_ERROR),
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
          ].indexOf(setting.controlType) === -1 &&
          [
            "APPSMITH_OAUTH2_OIDC_CLIENT_ID",
            "APPSMITH_OAUTH2_OIDC_CLIENT_SECRET",
          ].indexOf(setting.id) !== -1
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
      AnalyticsUtil.logEvent("ADMIN_SETTINGS_DISCONNECT_AUTH_METHOD", {
        method: pageTitle,
      });
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
          settings={settingsDetails}
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
            disconnect={() => disconnect(settingsDetails)}
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
