import React, { useCallback, useEffect } from "react";
import { Icon } from "@blueprintjs/core";
import { saveSettings } from "actions/settingsAction";
import Button, { Category } from "components/ads/Button";
import { SETTINGS_FORM_NAME } from "constants/forms";
import { createMessage } from "constants/messages";
import { ReduxActionTypes } from "constants/ReduxActionConstants";
import {
  APPLICATIONS_URL,
  ADMIN_SETTINGS_CATEGORY_DEFAULT_URL,
} from "constants/routes";
import _ from "lodash";
import ProductUpdatesModal from "pages/Applications/ProductUpdatesModal";
import { connect, useDispatch } from "react-redux";
import {
  Redirect,
  RouteComponentProps,
  useParams,
  withRouter,
} from "react-router";
import { AppState } from "reducers";
import { formValueSelector, InjectedFormProps, reduxForm } from "redux-form";
import {
  getSettings,
  getSettingsSavingState,
  getShowReleaseNotes,
} from "selectors/settingsSelectors";
import styled from "styled-components";
import history from "utils/history";
import Group from "./Main/group";
import RestartBanner from "./RestartBanner";
import { SettingsFactory, SettingTypes } from "./SettingsConfig";

const Wrapper = styled.div`
  flex-basis: calc(100% - ${(props) => props.theme.homePage.leftPane.width}px);
  padding-left: ${(props) =>
    props.theme.homePage.leftPane.rightMargin +
    props.theme.homePage.leftPane.leftPadding}px;
  padding-top: 40px;
  height: calc(100vh - ${(props) => props.theme.homePage.header}px);
  overflow: auto;
`;

const BackButton = styled.div`
  display: inline-block;
  cursor: pointer;
`;

const BackButtonText = styled.span``;

const SettingsFormWrapper = styled.div``;

const SettingsButtonWrapper = styled.div`
  position: fixed;
  bottom: 0;
  left: 0;
  width: 100%;
  height: ${(props) => props.theme.settings.footerHeight}px;
  padding: ${(props) => props.theme.spaces[11]}px 0px 0px
    ${(props) =>
      props.theme.spaces[6] +
      props.theme.homePage.leftPane.leftPadding +
      props.theme.homePage.leftPane.rightMargin +
      props.theme.homePage.leftPane.width}px;
  box-shadow: ${(props) => props.theme.settings.footerShadow};
  z-index: 2;
  background-color: ${(props) => props.theme.colors.homepageBackground};
`;

const StyledButton = styled(Button)`
  height: 24px;
  display: inline-block;
  margin-right: 16px;
`;

const StyledSaveButton = styled(StyledButton)`
  width: 128px;
  height: 38px;

  & .cs-spinner {
    top: 11px;
  }
`;

const StyledClearButton = styled(StyledButton)`
  width: 68px;
  height: 38px;
`;

export const BottomSpace = styled.div`
  height: ${(props) => props.theme.settings.footerHeight + 20}px;
`;

export const SettingsHeader = styled.h2`
  font-size: 24px;
  font-weight: 500;
  text-transform: capitalize;
  margin-bottom: 0;
`;

type MainProps = {
  settings: Record<string, string>;
  settingsConfig: Record<string, string | boolean>;
  isSaving: boolean;
  showReleaseNotes: boolean;
};

function getSettingLabel(name = "") {
  return name.replace(/-/g, " ");
}

function useSettings(category: string) {
  return SettingsFactory.get(category);
}

export function Main(
  props: InjectedFormProps & RouteComponentProps & MainProps,
) {
  const { category } = useParams() as any;
  const settings = useSettings(category);
  const dispatch = useDispatch();
  const isSavable = SettingsFactory.savableCategories.has(category);
  const onBack = () => {
    history.push(APPLICATIONS_URL);
  };
  const onSave = () => {
    dispatch(saveSettings(props.settings));
  };

  const onClear = () => {
    _.forEach(props.settingsConfig, (value, settingName) => {
      const setting = SettingsFactory.settingsMap[settingName];
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

  if (!SettingsFactory.categories.has(category)) {
    return <Redirect to={ADMIN_SETTINGS_CATEGORY_DEFAULT_URL} />;
  }

  return (
    <Wrapper>
      <BackButton className="t--admin-settings-back-button" onClick={onBack}>
        <Icon icon="chevron-left" iconSize={16} />
        <BackButtonText>&nbsp;Back</BackButtonText>
      </BackButton>
      <SettingsFormWrapper>
        <SettingsHeader>{getSettingLabel(category)} settings</SettingsHeader>
        <Group settings={settings} />
        {isSavable && (
          <SettingsButtonWrapper>
            <StyledSaveButton
              category={Category.primary}
              className="t--admin-settings-save-button"
              disabled={Object.keys(props.settings).length == 0 || !props.valid}
              isLoading={props.isSaving}
              onClick={onSave}
              tag="button"
              text={createMessage(() => "Save & Restart")}
            />
            <StyledClearButton
              category={Category.tertiary}
              className="t--admin-settings-reset-button"
              disabled={Object.keys(props.settings).length == 0}
              onClick={onClear}
              tag="button"
              text={createMessage(() => "Reset")}
            />
          </SettingsButtonWrapper>
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
    const message = SettingsFactory.validate(name, value);
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
    _.forEach(SettingsFactory.settingsMap, (setting, name) => {
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
    })(Main),
  ),
);
