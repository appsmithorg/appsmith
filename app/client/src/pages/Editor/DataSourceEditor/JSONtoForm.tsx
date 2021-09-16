import React from "react";
import styled from "styled-components";
import _ from "lodash";
import FormControl from "../FormControl";
import Collapsible from "./Collapsible";
import { ControlProps } from "components/formControls/BaseControl";
import { Datasource } from "entities/Datasource";
import { isHidden } from "components/formControls/utils";
import log from "loglevel";
import CenteredWrapper from "components/designSystems/appsmith/CenteredWrapper";
import CloseEditor from "components/editorComponents/CloseEditor";
import { getType, Types } from "utils/TypeHelpers";
import { BaseButton } from "components/designSystems/appsmith/BaseButton";

export const LoadingContainer = styled(CenteredWrapper)`
  height: 50%;
`;

export const PluginImage = styled.img`
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
  //margin-top: 16px;
`;

export const SaveButtonContainer = styled.div`
  margin-top: 24px;
  display: flex;
  justify-content: flex-end;
`;

export const ActionButton = styled(BaseButton)`
  &&& {
    max-width: 72px;
    margin-right: 9px;
    min-height: 32px;
  }
`;

const DBForm = styled.div`
  flex: 1;
  padding: 20px;
  margin-right: 0px;
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

export interface JSONtoFormProps {
  formData: Datasource;
  formName: string;
  formConfig: any[];
  datasourceId: string;
}

export class JSONtoForm<
  P = unknown,
  S = unknown,
  SS = any
> extends React.Component<JSONtoFormProps & P, S, SS> {
  requiredFields: Record<string, any> = {};
  configDetails: Record<string, any> = {};

  componentDidMount() {
    this.requiredFields = {};
    this.configDetails = {};
  }

  componentDidUpdate(prevProps: JSONtoFormProps) {
    if (prevProps.datasourceId !== this.props.datasourceId) {
      this.requiredFields = {};
      this.configDetails = {};
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
        const arrayValues = _.get(values, configProperty[0], []);
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

    return !_.isEmpty(errors);
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
        const values = _.get(formData, properties[0], []);
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

  getTrimmedData = (formData: any) => {
    const dataType = getType(formData);
    const isArrayorObject = (type: ReturnType<typeof getType>) =>
      type === Types.ARRAY || type === Types.OBJECT;

    if (isArrayorObject(dataType)) {
      Object.keys(formData).map((key) => {
        const valueType = getType(formData[key]);
        if (isArrayorObject(valueType)) {
          this.getTrimmedData(formData[key]);
        } else if (valueType === Types.STRING) {
          formData[key] = formData[key].trim();
        }
      });
    }
    return formData;
  };

  renderForm = (content: any) => {
    return (
      <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
        <CloseEditor />
        <DBForm>{content}</DBForm>
      </div>
    );
  };

  renderMainSection = (section: any, index: number) => {
    if (isHidden(this.props.formData, section.hidden)) return null;
    return (
      <Collapsible defaultIsOpen={index === 0} title={section.sectionName}>
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
            formName={this.props.formName}
            multipleConfig={multipleConfig}
          />
        </div>
      );
    } catch (e) {
      log.error(e);
    }
  };

  setupConfig = (config: ControlProps) => {
    const { configProperty, controlType, isRequired } = config;
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
            const { children } = propertyControlOrSection as any;
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
