import React, { useCallback, useEffect } from "react";
import { saveSettings } from "@appsmith/actions/settingsAction";
import { SETTINGS_FORM_NAME } from "@appsmith/constants/forms";
import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";
import _ from "lodash";
import ProductUpdatesModal from "pages/Applications/ProductUpdatesModal";
import { connect, useDispatch, useSelector } from "react-redux";
import type { RouteComponentProps } from "react-router";
import { useParams, withRouter } from "react-router";
import type { AppState } from "@appsmith/reducers";
import type { InjectedFormProps } from "redux-form";
import { formValueSelector, reduxForm } from "redux-form";
import {
  getSettings,
  getSettingsSavingState,
  getShowReleaseNotes,
} from "selectors/settingsSelectors";
import Group from "./FormGroup/group";
import RestartBanner from "./RestartBanner";
import SaveAdminSettings from "./SaveSettings";
import { DisconnectService } from "./DisconnectService";
import AdminConfig from "@appsmith/pages/AdminSettings/config";
import type { Setting } from "@appsmith/pages/AdminSettings/config/types";
import { SettingTypes } from "@appsmith/pages/AdminSettings/config/types";
import {
  createMessage,
  DISCONNECT_AUTH_ERROR,
  DISCONNECT_SERVICE_SUBHEADER,
  DISCONNECT_SERVICE_WARNING,
  MANDATORY_FIELDS_ERROR,
} from "@appsmith/constants/messages";
import { Toaster, Variant } from "design-system-old";
import { saveAllowed } from "@appsmith/utils/adminSettingsHelpers";
import AnalyticsUtil from "utils/AnalyticsUtil";
import {
  Wrapper,
  BottomSpace,
  HeaderWrapper,
  SettingsHeader,
  SettingsSubHeader,
  SettingsFormWrapper,
  MaxWidthWrapper,
} from "./components";
import { BackButton } from "components/utils/helperComponents";
import { getThirdPartyAuths } from "@appsmith/selectors/tenantSelectors";
import { getAppsmithConfigs } from "@appsmith/configs";

const { disableLoginForm } = getAppsmithConfigs();

type FormProps = {
  settings: Record<string, string>;
  settingsConfig: Record<string, string | boolean>;
  isSaving: boolean;
  showReleaseNotes: boolean;
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

export function SettingsForm(
  props: InjectedFormProps & RouteComponentProps & FormProps,
) {
  const params = useParams() as any;
  const { category, selected: subCategory } = params;
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
  const socialLoginList = useSelector(getThirdPartyAuths);

  const onSave = () => {
    if (checkMandatoryFileds()) {
      if (saveAllowed(props.settings, socialLoginList)) {
        AnalyticsUtil.logEvent("ADMIN_SETTINGS_SAVE", {
          method: pageTitle,
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
      if (
        setting &&
        (setting.controlType == SettingTypes.TOGGLE ||
          setting.controlType == SettingTypes.CHECKBOX)
      ) {
        const settingsStr = props.settingsConfig[settingName].toString();
        if (settingName.toLowerCase().includes("enable")) {
          props.settingsConfig[settingName] =
            settingsStr === "" || settingsStr === "true";
        } else {
          props.settingsConfig[settingName] = settingsStr === "true";
        }
      }
    });
    props.initialize(props.settingsConfig);
  };

  useEffect(onClear, [subCategory]);

  const onReleaseNotesClose = useCallback(() => {
    dispatch({
      type: ReduxActionTypes.TOGGLE_RELEASE_NOTES,
      payload: false,
    });
  }, []);

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
    const connectedMethodsCount =
      socialLoginList.length + (disableLoginForm ? 0 : 1);
    if (connectedMethodsCount >= 2) {
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
      {subCategory && <BackButton />}
      <SettingsFormWrapper>
        <MaxWidthWrapper>
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
        </MaxWidthWrapper>
      </SettingsFormWrapper>
      {props.showReleaseNotes && (
        <ProductUpdatesModal hideTrigger isOpen onClose={onReleaseNotesClose} />
      )}
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
      showReleaseNotes: getShowReleaseNotes(state),
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
    })(SettingsForm),
  ),
);
