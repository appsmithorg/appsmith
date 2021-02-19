import React from "react";
import styled from "styled-components";
import _ from "lodash";
import { DATASOURCE_SAAS_FORM } from "constants/forms";
import { SAAS_EDITOR_URL } from "./constants";
import FormControl from "../FormControl";
import Collapsible from "pages/Editor/DataSourceEditor/Collapsible";
import history from "utils/history";

import FormTitle from "pages/Editor/DataSourceEditor/FormTitle";
import { ControlProps } from "components/formControls/BaseControl";
import Button from "components/editorComponents/Button";
import { Datasource } from "entities/Datasource";
import { reduxForm, InjectedFormProps, getFormValues } from "redux-form";
import { BaseButton } from "components/designSystems/blueprint/ButtonComponent";
import BackButton from "pages/Editor/DataSourceEditor/BackButton";
import { isHidden } from "components/formControls/utils";
import log from "loglevel";
import { Spinner } from "@blueprintjs/core";
import CenteredWrapper from "components/designSystems/appsmith/CenteredWrapper";
import { RouteComponentProps } from "react-router";
import { connect } from "react-redux";
import { AppState } from "reducers";
import { getDatasource, getPluginImages } from "selectors/entitiesSelector";
import { ReduxAction } from "constants/ReduxActionConstants";
import {
  deleteDatasource,
  redirectAuthorizationCode,
  updateDatasource,
} from "actions/datasourceActions";
import { fetchPluginForm } from "actions/pluginActions";
import { historyPush } from "actions/utilActions";
import { createNewApiName } from "utils/AppsmithUtils";
import { createActionRequest } from "actions/actionActions";
import { ActionDataState } from "reducers/entityReducers/actionsReducer";
import {
  SAAS_AUTHORIZATION_APPSMITH_ERROR,
  SAAS_AUTHORIZATION_FAILED,
  SAAS_AUTHORIZATION_SUCCESSFUL,
} from "constants/messages";
import { Variant } from "components/ads/common";
import { Toaster } from "components/ads/Toast";

interface StateProps {
  isSaving: boolean;
  isDeleting: boolean;
  loadingFormConfigs: boolean;
  formData: Datasource;
  formConfig: any[];
  isNewDatasource: boolean;
  pluginImage: string;
  pluginId: string;
  actions: ActionDataState;
}

interface DispatchFunctions {
  fetchPluginForm: (id: string) => void;
  updateDatasource: (formData: any, onSuccess?: ReduxAction<unknown>) => void;
  deleteDatasource: (id: string, onSuccess?: ReduxAction<unknown>) => void;
}

type DatasourceSaaSEditorProps = StateProps &
  DispatchFunctions &
  RouteComponentProps<{
    datasourceId: string;
    applicationId: string;
    pageId: string;
    pluginPackageName: string;
  }>;

type Props = DatasourceSaaSEditorProps &
  InjectedFormProps<Datasource, DatasourceSaaSEditorProps>;

export const LoadingContainer = styled(CenteredWrapper)`
  height: 50%;
`;

const DBForm = styled.div`
  padding: 20px;
  margin-left: 10px;
  margin-right: 0px;
  height: calc(100vh - ${(props) => props.theme.smallHeaderHeight});
  overflow: auto;
  .backBtn {
    padding-bottom: 1px;
    cursor: pointer;
  }
  .backBtnText {
    font-size: 16px;
    font-weight: 500;
    cursor: pointer;
  }
`;

const PluginImage = styled.img`
  height: 40px;
  width: auto;
`;

export const FormTitleContainer = styled.div`
  flex-direction: row;
  display: flex;
  align-items: center;
`;

export const Header = styled.div`
  flex-direction: row;
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 16px;
`;

const SaveButtonContainer = styled.div`
  margin-top: 24px;
  display: flex;
  justify-content: flex-end;
`;

const ActionButton = styled(BaseButton)`
  &&& {
    max-width: 72px;
    margin-right: 9px;
    min-height: 32px;
  }
`;

const StyledButton = styled(Button)`
  &&&& {
    width: 180px;
    height: 32px;
  }
`;

const CreateApiButton = styled(BaseButton)`
  &&& {
    max-width: 120px;
    margin-right: 9px;
    align-self: center;
    min-height: 32px;
  }
`;

class DatasourceSaaSEditor extends React.Component<Props> {
  requiredFields: Record<string, any> = {};
  configDetails: Record<string, any> = {};

  componentDidMount() {
    this.requiredFields = {};
    this.configDetails = {};
    if (this.props.pluginId) {
      this.props.fetchPluginForm(this.props.pluginId);
    }
    const search = new URLSearchParams(this.props.location.search);
    const status = search.get("response_status");

    if (status) {
      const display_message = search.get("display_message");
      // Set default error message
      let message = SAAS_AUTHORIZATION_FAILED;
      let variant = Variant.danger;
      if (status === "success") {
        message = SAAS_AUTHORIZATION_SUCCESSFUL;
        variant = Variant.success;
      } else if (status === "appsmith_error") {
        message = SAAS_AUTHORIZATION_APPSMITH_ERROR;
      }
      Toaster.show({ text: display_message || message, variant });
    }
  }

  componentDidUpdate(prevProps: Props) {
    if (
      prevProps.match.params.datasourceId !==
      this.props.match.params.datasourceId
    ) {
      this.requiredFields = {};
      this.configDetails = {};
    }
    if (this.props.pluginId && prevProps.pluginId !== this.props.pluginId) {
      this.props.fetchPluginForm(this.props.pluginId);
    }
  }

  validate = () => {
    const errors = {} as any;
    const requiredFields = Object.keys(this.requiredFields);
    const values = this.props.formData;

    requiredFields.forEach((fieldConfigProperty) => {
      const fieldConfig = this.requiredFields[fieldConfigProperty];
      if (fieldConfig.controlType === "KEYVALUE_ARRAY") {
        const configProperty = fieldConfig.configProperty.split("[*].");
        const arrayValues = _.get(values, configProperty[0]);
        const keyValueArrayErrors: Record<string, string>[] = [];

        arrayValues.forEach((value: any, index: number) => {
          const objectKeys = Object.keys(value);
          const keyValueErrors: Record<string, string> = {};

          if (!value[objectKeys[0]]) {
            keyValueErrors[objectKeys[0]] = "This field is required";
            keyValueArrayErrors[index] = keyValueErrors;
          }
          if (!value[objectKeys[1]]) {
            keyValueErrors[objectKeys[1]] = "This field is required";
            keyValueArrayErrors[index] = keyValueErrors;
          }
        });

        if (keyValueArrayErrors.length) {
          _.set(errors, configProperty[0], keyValueArrayErrors);
        }
      } else if (fieldConfig.controlType === "KEY_VAL_INPUT") {
        const value = _.get(values, fieldConfigProperty, []);

        if (value.length) {
          const values = Object.values(value[0]);
          const isNotBlank = values.every((value) => value);

          if (!isNotBlank) {
            _.set(errors, fieldConfigProperty, "This field is required");
          }
        }
      } else {
        const value = _.get(values, fieldConfigProperty);

        if (!value) {
          _.set(errors, fieldConfigProperty, "This field is required");
        }
      }
    });

    return !_.isEmpty(errors) || this.props.invalid;
  };

  render() {
    const { formConfig, loadingFormConfigs } = this.props;
    if (loadingFormConfigs) {
      return (
        <LoadingContainer>
          <Spinner size={30} />
        </LoadingContainer>
      );
    }
    const content = this.renderDataSourceConfigForm(formConfig);
    return <DBForm>{content}</DBForm>;
  }

  normalizeValues = () => {
    let { formData } = this.props;
    const checked: Record<string, any> = {};
    const configProperties = Object.keys(this.configDetails);

    for (const configProperty of configProperties) {
      const controlType = this.configDetails[configProperty];

      if (controlType === "KEYVALUE_ARRAY") {
        const properties = configProperty.split("[*].");

        if (checked[properties[0]]) continue;

        checked[properties[0]] = 1;
        const values = _.get(formData, properties[0]);
        const newValues: ({ [s: string]: unknown } | ArrayLike<unknown>)[] = [];

        values.forEach(
          (object: { [s: string]: unknown } | ArrayLike<unknown>) => {
            const isEmpty = Object.values(object).every((x) => x === "");

            if (!isEmpty) {
              newValues.push(object);
            }
          },
        );

        if (newValues.length) {
          formData = _.set(formData, properties[0], newValues);
        } else {
          formData = _.set(formData, properties[0], []);
        }
      } else if (controlType === "KEY_VAL_INPUT") {
        if (checked[configProperty]) continue;

        const values = _.get(formData, configProperty);
        const newValues: ({ [s: string]: unknown } | ArrayLike<unknown>)[] = [];

        values.forEach(
          (object: { [s: string]: unknown } | ArrayLike<unknown>) => {
            const isEmpty = Object.values(object).every((x) => x === "");

            if (!isEmpty) {
              newValues.push(object);
            }
          },
        );

        if (newValues.length) {
          formData = _.set(formData, configProperty, newValues);
        } else {
          formData = _.set(formData, configProperty, []);
        }
      }
    }

    return formData;
  };

  save = (onSuccess?: ReduxAction<unknown>) => {
    const normalizedValues = this.normalizeValues();
    this.props.updateDatasource(normalizedValues, onSuccess);
  };

  createApiAction = () => {
    const {
      formData,
      actions,
      match: {
        params: { pageId },
      },
    } = this.props;
    const newApiName = createNewApiName(actions, pageId || "");

    this.save(
      createActionRequest({
        name: newApiName,
        pageId: pageId,
        pluginId: formData.pluginId,
        datasource: {
          id: formData.id,
        },
      }),
    );
  };

  renderDataSourceConfigForm = (sections: any) => {
    const {
      match: {
        params: { applicationId, datasourceId, pageId, pluginPackageName },
      },
      isSaving,
      isDeleting,
      deleteDatasource,
    } = this.props;

    return (
      <form
        onSubmit={(e) => {
          e.preventDefault();
        }}
      >
        <BackButton
          onClick={() =>
            history.push(
              SAAS_EDITOR_URL(applicationId, pageId, pluginPackageName),
            )
          }
        />
        <br />
        <Header>
          <FormTitleContainer>
            <PluginImage src={this.props.pluginImage} alt="Datasource" />
            <FormTitle focusOnMount={this.props.isNewDatasource} />
          </FormTitleContainer>
          <CreateApiButton
            className="t--create-query"
            icon={"plus"}
            text="New API"
            filled
            accent="primary"
            disabled={this.validate()}
            loading={isSaving}
            onClick={() => this.createApiAction()}
          />
        </Header>

        <>
          {!_.isNil(sections)
            ? _.map(sections, this.renderMainSection)
            : undefined}
          <SaveButtonContainer>
            <ActionButton
              className="t--delete-datasource"
              text="Delete"
              accent="error"
              loading={isDeleting}
              onClick={() =>
                deleteDatasource(
                  datasourceId,
                  historyPush(
                    SAAS_EDITOR_URL(applicationId, pageId, pluginPackageName),
                  ),
                )
              }
            />

            <StyledButton
              className="t--save-datasource"
              onClick={() =>
                this.save(redirectAuthorizationCode(pageId, datasourceId))
              }
              text="Save and Authorize"
              disabled={this.validate()}
              loading={isSaving}
              intent="primary"
              filled
              size="small"
            />
          </SaveButtonContainer>
        </>
      </form>
    );
  };

  renderMainSection = (section: any, index: number) => {
    if (isHidden(this.props.formData, section.hidden)) return null;
    return (
      <Collapsible title={section.sectionName} defaultIsOpen={index === 0}>
        {this.renderEachConfig(section)}
      </Collapsible>
    );
  };

  renderSingleConfig = (
    config: ControlProps,
    multipleConfig?: ControlProps[],
  ) => {
    multipleConfig = multipleConfig || [];
    try {
      this.setupConfig(config);
      return (
        <div key={config.configProperty} style={{ marginTop: "16px" }}>
          <FormControl
            config={config}
            formName={DATASOURCE_SAAS_FORM}
            multipleConfig={multipleConfig}
          />
        </div>
      );
    } catch (e) {
      log.error(e);
    }
  };

  setupConfig = (config: ControlProps) => {
    const { controlType, isRequired, configProperty } = config;
    this.configDetails[configProperty] = controlType;

    if (isRequired) {
      this.requiredFields[configProperty] = config;
    }
  };

  isKVArray = (children: Array<ControlProps>) => {
    if (!Array.isArray(children) || children.length < 2) return false;
    return (
      children[0].controlType && children[0].controlType === "KEYVALUE_ARRAY"
    );
  };

  renderKVArray = (children: Array<ControlProps>) => {
    try {
      // setup config for each child
      children.forEach((c) => this.setupConfig(c));
      // We pass last child for legacy reasons, to keep the logic here exactly same as before.
      return this.renderSingleConfig(children[children.length - 1], children);
    } catch (e) {
      log.error(e);
    }
  };

  renderEachConfig = (section: any) => {
    return (
      <div key={section.sectionName}>
        {_.map(section.children, (propertyControlOrSection: ControlProps) => {
          // If the section is hidden, skip rendering
          if (isHidden(this.props.formData, section.hidden)) return null;
          if ("children" in propertyControlOrSection) {
            const { children } = propertyControlOrSection;
            if (this.isKVArray(children)) {
              return this.renderKVArray(children);
            }
            return this.renderEachConfig(propertyControlOrSection);
          } else {
            return this.renderSingleConfig(propertyControlOrSection);
          }
        })}
      </div>
    );
  };
}
const mapStateToProps = (state: AppState, props: any) => {
  const { datasourcePane } = state.ui;
  const { datasources, plugins } = state.entities;
  const datasource = getDatasource(state, props.match.params.datasourceId);
  const { formConfigs, loadingFormConfigs } = plugins;
  const formData = getFormValues(DATASOURCE_SAAS_FORM)(state) as Datasource;
  const pluginId = _.get(datasource, "pluginId", "");
  return {
    isSaving: datasources.loading,
    isDeleting: datasources.isDeleting,
    loadingFormConfigs: loadingFormConfigs,
    formData: formData,
    formConfig: formConfigs[pluginId],
    isNewDatasource:
      datasourcePane.newDatasource === props.match.params.datasourceId,
    pluginImage: getPluginImages(state)[pluginId],
    initialValues: datasource,
    pluginId: pluginId,
    actions: state.entities.actions,
  };
};

const mapDispatchToProps = (dispatch: any): DispatchFunctions => {
  return {
    deleteDatasource: (id: string, onSuccess?: ReduxAction<unknown>) =>
      dispatch(deleteDatasource({ id }, onSuccess)),
    fetchPluginForm: (id: string) => dispatch(fetchPluginForm({ id })),
    updateDatasource: (formData: any, onSuccess?: ReduxAction<unknown>) =>
      dispatch(updateDatasource(formData, onSuccess)),
  };
};

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(
  reduxForm<Datasource, DatasourceSaaSEditorProps>({
    form: DATASOURCE_SAAS_FORM,
    enableReinitialize: true,
  })(DatasourceSaaSEditor),
);
