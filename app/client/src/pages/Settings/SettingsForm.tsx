import React, { useCallback, useEffect } from "react";
// import { Icon } from "@blueprintjs/core";
import { saveSettings } from "actions/settingsAction";
import { SETTINGS_FORM_NAME } from "constants/forms";
import { ReduxActionTypes } from "constants/ReduxActionConstants";
// import { APPLICATIONS_URL } from "constants/routes";
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
// import history from "utils/history";
import Group from "./FormGroup/group";
import RestartBanner from "./RestartBanner";
import AdminConfig from "./config";
import { SettingTypes } from "@appsmith/pages/AdminSettings/config/types";
import SaveAdminSettings from "./SaveSettings";
import Breadcrumbs, { BreadcrumbCategories } from "components/ads/Breadcrumbs";
import { IBreadcrumbProps } from "@blueprintjs/core";

const Wrapper = styled.div`
  flex-basis: calc(100% - ${(props) => props.theme.homePage.leftPane.width}px);
  margin-left: 112px;
  padding-top: 40px;
  height: calc(100vh - ${(props) => props.theme.homePage.header}px);
  overflow: auto;
`;

/*const BackButton = styled.div`
  display: inline-block;
  cursor: pointer;
`;

const BackButtonText = styled.span``;*/

const SettingsFormWrapper = styled.div``;

export const BottomSpace = styled.div`
  height: ${(props) => props.theme.settings.footerHeight + 20}px;
`;

export const SettingsHeader = styled.h2`
  font-size: 24px;
  font-weight: 500;
  text-transform: capitalize;
  margin-bottom: 0;
`;

type FormProps = {
  settings: Record<string, string>;
  settingsConfig: Record<string, string | boolean>;
  isSaving: boolean;
  showReleaseNotes: boolean;
};

function getSettingLabel(name = "") {
  return name.replace(/-/g, " ");
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
  const dispatch = useDispatch();
  const isSavable = AdminConfig.savableCategories.includes(
    subCategory ?? category,
  );
  /*const onBack = () => {
    history.push(APPLICATIONS_URL);
  };*/
  const onSave = () => {
    dispatch(saveSettings(props.settings));
  };

  const onClear = () => {
    _.forEach(props.settingsConfig, (value, settingName) => {
      const setting = AdminConfig.settingsMap[settingName];
      if (setting && setting.controlType == SettingTypes.TOGGLE) {
        props.settingsConfig[settingName] =
          props.settingsConfig[settingName].toString() == "true";
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

  const breadcrumbList: IBreadcrumbProps[] = [
    BreadcrumbCategories.HOMEPAGE,
    ...(category !== "general" ? [BreadcrumbCategories.DEFAULT_SETTINGS] : []),
    ...(subCategory
      ? [BreadcrumbCategories[category], BreadcrumbCategories[subCategory]]
      : [BreadcrumbCategories[category]]),
  ];

  return (
    <Wrapper>
      {/*<BackButton className="t--admin-settings-back-button" onClick={onBack}>
        <Icon icon="chevron-left" iconSize={16} />
        <BackButtonText>&nbsp;Back</BackButtonText>
      </BackButton>*/}
      <Breadcrumbs items={breadcrumbList} />
      <SettingsFormWrapper>
        <SettingsHeader>
          {getSettingLabel(subCategory ?? category)} settings
        </SettingsHeader>
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
