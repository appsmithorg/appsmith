import React, { useCallback, useEffect, useMemo } from "react";
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
import {
  isTenantConfig,
  saveAllowed,
} from "@appsmith/utils/adminSettingsHelpers";
import AnalyticsUtil from "utils/AnalyticsUtil";
import {
  Wrapper,
  BottomSpace,
  HeaderWrapper,
  SettingsHeader,
  SettingsSubHeader,
  SettingsFormWrapper,
} from "./components";
import { BackButton } from "components/utils/helperComponents";
import { toast } from "design-system";
import {
  getIsFormLoginEnabled,
  getThirdPartyAuths,
} from "@appsmith/selectors/tenantSelectors";
import { updateTenantConfig } from "@appsmith/actions/tenantActions";
import { tenantConfigConnection } from "@appsmith/constants/tenantConstants";

interface FormProps {
  settings: Record<string, string>;
  settingsConfig: Record<string, string | boolean>;
  isSaving: boolean;
  showReleaseNotes: boolean;
}

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
  const isFormLoginEnabled = useSelector(getIsFormLoginEnabled);
  const socialLoginList = useSelector(getThirdPartyAuths);

  const updatedTenantSettings = useMemo(
    () => Object.keys(props.settings).filter((s) => isTenantConfig(s)),
    [props.settings],
  );

  // Is there a non-tenant (env) config in this category of settings?
  const isOnlyTenantConfig = !settingsDetails.find(
    (s) =>
      s.category === (subCategory || category) &&
      s.controlType != SettingTypes.CALLOUT &&
      !isTenantConfig(s.id),
  );

  const saveChangedSettings = () => {
    const settingsKeyLength = Object.keys(props.settings).length;
    const isOnlyEnvSettings =
      updatedTenantSettings.length === 0 && settingsKeyLength !== 0;
    const isEnvAndTenantSettings =
      updatedTenantSettings.length !== 0 &&
      updatedTenantSettings.length !== settingsKeyLength;
    if (isOnlyEnvSettings) {
      // only env settings
      dispatch(saveSettings(props.settings));
    } else {
      // only tenant settings
      const config: any = {};
      for (const each in props.settings) {
        if (tenantConfigConnection.includes(each)) {
          config[each] = props.settings[each];
        }
      }
      dispatch(
        updateTenantConfig({
          tenantConfiguration: config,
          isOnlyTenantSettings: !isEnvAndTenantSettings,
          needsRefresh: details?.needsRefresh,
        }),
      );
      // both env and tenant settings
      if (isEnvAndTenantSettings) {
        const filteredSettings = Object.keys(props.settings)
          .filter((key) => !isTenantConfig(key))
          .reduce((obj, key) => {
            return Object.assign(obj, {
              [key]: props.settings[key],
            });
          }, {});
        dispatch(saveSettings(filteredSettings));
      }
    }
  };

  const onSave = () => {
    if (checkMandatoryFileds()) {
      if (saveAllowed(props.settings, isFormLoginEnabled, socialLoginList)) {
        AnalyticsUtil.logEvent("ADMIN_SETTINGS_SAVE", {
          method: pageTitle,
        });
        saveChangedSettings();
      } else {
        saveBlocked();
      }
    } else {
      AnalyticsUtil.logEvent("ADMIN_SETTINGS_ERROR", {
        error: createMessage(MANDATORY_FIELDS_ERROR),
      });
      toast.show(createMessage(MANDATORY_FIELDS_ERROR), {
        kind: "error",
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
    toast.show(createMessage(DISCONNECT_AUTH_ERROR), {
      kind: "error",
    });
  };

  const disconnect = (currentSettings: AdminConfig) => {
    const updatedSettings: any = {};
    const connectedMethodsCount =
      socialLoginList.length + (isFormLoginEnabled ? 1 : 0);
    if (connectedMethodsCount >= 2) {
      _.forEach(currentSettings, (setting: Setting) => {
        if (
          !setting.isHidden &&
          [
            SettingTypes.CALLOUT,
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
        <HeaderWrapper>
          <SettingsHeader
            color="var(--ads-v2-color-fg-emphasis-plus)"
            kind="heading-l"
            renderAs="h1"
          >
            {pageTitle}
          </SettingsHeader>
          {details?.subText && (
            <SettingsSubHeader
              color="var(--ads-v2-color-fg-emphasis)"
              kind="body-m"
              renderAs="h2"
            >
              {details.subText}
            </SettingsSubHeader>
          )}
        </HeaderWrapper>
        <Group
          category={category}
          settings={settingsDetails}
          subCategory={subCategory}
        />
        {isSavable && (
          <SaveAdminSettings
            isOnlyTenantConfig={isOnlyTenantConfig}
            isSaving={props.isSaving}
            needsRefresh={details?.needsRefresh}
            onClear={onClear}
            onSave={onSave}
            settings={props.settings}
            updatedTenantSettings={updatedTenantSettings}
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
      const doNotUpdate =
        setting.controlType === SettingTypes.CHECKBOX &&
        !settingsConfig[name] &&
        !fieldValue;
      //We are not performing type check here as inputs we take are stored as string
      //But server stores as numeric, string etc..
      if (fieldValue != settingsConfig[name] && !doNotUpdate) {
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
