import React, { useCallback, useEffect } from "react";
import { saveSettings } from "actions/settingsAction";
import { SETTINGS_FORM_NAME } from "constants/forms";
import { ReduxActionTypes } from "constants/ReduxActionConstants";
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
import styled from "styled-components";
import Group from "./FormGroup/group";
import RestartBanner from "./RestartBanner";
import AdminConfig from "./config";
import SaveAdminSettings from "./SaveSettings";
import { SettingTypes } from "@appsmith/pages/AdminSettings/config/types";

const Wrapper = styled.div`
  flex-basis: calc(100% - ${(props) => props.theme.homePage.leftPane.width}px);
  margin-left: ${(props) => props.theme.homePage.main.marginLeft}px;
  padding-top: 40px;
  height: calc(100vh - ${(props) => props.theme.homePage.header}px);
  overflow: auto;
`;

const SettingsFormWrapper = styled.div``;

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
  showReleaseNotes: boolean;
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

export function SettingsForm(
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

  const onSave = () => {
    dispatch(saveSettings(props.settings));
  };

  const onClear = () => {
    _.forEach(props.settingsConfig, (value, settingName) => {
      const setting = AdminConfig.settingsMap[settingName];
      if (setting && setting.controlType == SettingTypes.TOGGLE) {
        props.settingsConfig[settingName] =
          props.settingsConfig[settingName].toString() == "true";

        if (
          typeof props.settingsConfig["APPSMITH_SIGNUP_DISABLED"] ===
          "undefined"
        ) {
          props.settingsConfig["APPSMITH_SIGNUP_DISABLED"] = true;
        }
      }
    });
    props.initialize(props.settingsConfig);
  };

  useEffect(onClear, []);

  const onReleaseNotesClose = useCallback(() => {
    dispatch({
      type: ReduxActionTypes.TOGGLE_RELEASE_NOTES,
      payload: false,
    });
  }, []);

  return (
    <Wrapper>
      <SettingsFormWrapper>
        <HeaderWrapper>
          <SettingsHeader>
            {getSettingLabel(details?.title || (subCategory ?? category))}
          </SettingsHeader>
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
    const message = AdminConfig.validate(name, value);
    if (message) {
      errors[name] = message;
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
