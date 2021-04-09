import React from "react";
import styled from "styled-components";
import _ from "lodash";
import { DATASOURCE_DB_FORM } from "constants/forms";
import { DATA_SOURCES_EDITOR_URL } from "constants/routes";
import FormControl from "../FormControl";
import Collapsible from "./Collapsible";
import history from "utils/history";
import { Icon } from "@blueprintjs/core";
import FormTitle from "./FormTitle";
import { ControlProps } from "components/formControls/BaseControl";

import CollapsibleHelp from "components/designSystems/appsmith/help/CollapsibleHelp";
import Connected from "./Connected";

import { HelpBaseURL, HelpMap } from "constants/HelpConstants";
import Button from "components/editorComponents/Button";
import { Datasource } from "entities/Datasource";
import { reduxForm, InjectedFormProps } from "redux-form";
import { BaseButton } from "components/designSystems/blueprint/ButtonComponent";
import { APPSMITH_IP_ADDRESSES } from "constants/DatasourceEditorConstants";
import { getAppsmithConfigs } from "configs";
import AnalyticsUtil from "utils/AnalyticsUtil";
import { convertArrayToSentence } from "utils/helpers";
import BackButton from "./BackButton";
import { PluginType } from "entities/Action";
import Boxed from "components/editorComponents/Onboarding/Boxed";
import { OnboardingStep } from "constants/OnboardingConstants";
import { isHidden } from "components/formControls/utils";
import log from "loglevel";
import CenteredWrapper from "components/designSystems/appsmith/CenteredWrapper";

const { cloudHosting } = getAppsmithConfigs();

interface DatasourceDBEditorProps {
  onSave: (formValues: Datasource) => void;
  onTest: (formValus: Datasource) => void;
  handleDelete: (id: string) => void;
  setDatasourceEditorMode: (id: string, viewMode: boolean) => void;
  selectedPluginPackage: string;
  isSaving: boolean;
  isDeleting: boolean;
  datasourceId: string;
  applicationId: string;
  pageId: string;
  formData: Datasource;
  isTesting: boolean;
  formConfig: any[];
  isNewDatasource: boolean;
  pluginImage: string;
  viewMode: boolean;
  pluginType: string;
}

interface DatasourceDBEditorState {
  viewMode: boolean;
}

type Props = DatasourceDBEditorProps &
  InjectedFormProps<Datasource, DatasourceDBEditorProps>;

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
    width: 87px;
    height: 32px;
  }
`;

const StyledOpenDocsIcon = styled(Icon)`
  svg {
    width: 12px;
    height: 18px;
  }
`;

const CollapsibleWrapper = styled.div`
  width: max-content;
`;

class DatasourceDBEditor extends React.Component<
  Props,
  DatasourceDBEditorState
> {
  requiredFields: Record<string, any>;
  configDetails: Record<string, any>;
  constructor(props: Props) {
    super(props);

    this.state = {
      viewMode: true,
    };
    this.requiredFields = {};
    this.configDetails = {};
  }

  componentDidMount() {
    this.requiredFields = {};
    this.configDetails = {};
  }

  componentDidUpdate(prevProps: Props) {
    if (prevProps.datasourceId !== this.props.datasourceId) {
      this.requiredFields = {};
      this.configDetails = {};
      this.props.setDatasourceEditorMode(this.props.datasourceId, true);
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
    const { formConfig } = this.props;
    const content = this.renderDataSourceConfigForm(formConfig);
    return <DBForm>{content}</DBForm>;
  }

  isNewDatasource = () => {
    const { datasourceId } = this.props;

    return datasourceId.includes(":");
  };

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

  save = () => {
    const normalizedValues = this.normalizeValues();
    AnalyticsUtil.logEvent("SAVE_DATA_SOURCE_CLICK", {
      pageId: this.props.pageId,
      appId: this.props.applicationId,
    });
    this.props.onSave(normalizedValues);
  };

  test = () => {
    const normalizedValues = this.normalizeValues();
    AnalyticsUtil.logEvent("TEST_DATA_SOURCE_CLICK", {
      pageId: this.props.pageId,
      appId: this.props.applicationId,
    });
    this.props.onTest(normalizedValues);
  };

  renderDataSourceConfigForm = (sections: any) => {
    const {
      isSaving,
      applicationId,
      pageId,
      isTesting,
      isDeleting,
      datasourceId,
      handleDelete,
      pluginType,
    } = this.props;
    const { viewMode } = this.props;

    return (
      <form
        onSubmit={(e) => {
          e.preventDefault();
        }}
      >
        <BackButton
          onClick={() =>
            history.push(DATA_SOURCES_EDITOR_URL(applicationId, pageId))
          }
        />
        <br />
        <Header>
          <FormTitleContainer>
            <PluginImage src={this.props.pluginImage} alt="Datasource" />
            <FormTitle focusOnMount={this.props.isNewDatasource} />
          </FormTitleContainer>
          {viewMode && (
            <Boxed step={OnboardingStep.SUCCESSFUL_BINDING}>
              <ActionButton
                className="t--edit-datasource"
                text="EDIT"
                accent="secondary"
                onClick={() => {
                  this.props.setDatasourceEditorMode(
                    this.props.datasourceId,
                    false,
                  );
                }}
              />
            </Boxed>
          )}
        </Header>
        {cloudHosting && pluginType === PluginType.DB && !viewMode && (
          <CollapsibleWrapper>
            <CollapsibleHelp>
              <span>{`Whitelist the IP ${convertArrayToSentence(
                APPSMITH_IP_ADDRESSES,
              )}  on your database instance to connect to it. `}</span>
              <a
                href={`${HelpBaseURL}${HelpMap["DATASOURCE_FORM"].path}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                {"Read more "}
                <StyledOpenDocsIcon icon="document-open" />
              </a>
            </CollapsibleHelp>
          </CollapsibleWrapper>
        )}
        {!viewMode ? (
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
                onClick={() => handleDelete(datasourceId)}
              />

              <ActionButton
                className="t--test-datasource"
                text="Test"
                loading={isTesting}
                accent="secondary"
                onClick={this.test}
              />
              <StyledButton
                className="t--save-datasource"
                onClick={this.save}
                text="Save"
                disabled={this.validate()}
                loading={isSaving}
                intent="primary"
                filled
                size="small"
              />
            </SaveButtonContainer>
          </>
        ) : (
          <Connected />
        )}
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
            formName={DATASOURCE_DB_FORM}
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

export default reduxForm<Datasource, DatasourceDBEditorProps>({
  form: DATASOURCE_DB_FORM,
})(DatasourceDBEditor);
