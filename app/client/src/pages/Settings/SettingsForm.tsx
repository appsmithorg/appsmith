import React, { useCallback, useEffect } from "react";
import { saveSettings } from "@appsmith/actions/settingsAction";
import { SETTINGS_FORM_NAME } from "constants/forms";
import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";
import _ from "lodash";
import ProductUpdatesModal from "pages/Applications/ProductUpdatesModal";
import { connect, useDispatch } from "react-redux";
import { RouteComponentProps, useParams, withRouter } from "react-router";
import { AppState } from "reducers";
import { formValueSelector, InjectedFormProps, reduxForm } from "redux-form";
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
import AnalyticsUtil from "utils/AnalyticsUtil";
import {
  Wrapper,
  BackButton,
  BottomSpace,
  HeaderWrapper,
  SettingsHeader,
  SettingsSubHeader,
  SettingsFormWrapper,
} from "./components";

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

  const onSave = () => {
    if (checkMandatoryFileds()) {
      if (saveAllowed(props.settings)) {
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
      if (setting && setting.controlType == SettingTypes.TOGGLE) {
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
    if (connectedMethods.length >= 2) {
      _.forEach(currentSettings, (setting: Setting) => {
        if (!setting.isHidden && setting.controlType !== SettingTypes.LINK) {
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
