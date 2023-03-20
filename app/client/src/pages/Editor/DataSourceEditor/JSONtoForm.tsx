import React from "react";
import styled from "styled-components";
import _ from "lodash";
import FormControl from "../FormControl";
import Collapsible from "./Collapsible";
import type { ControlProps } from "components/formControls/BaseControl";
import type { Datasource } from "entities/Datasource";
import { isHidden, isKVArray } from "components/formControls/utils";
import log from "loglevel";
import CloseEditor from "components/editorComponents/CloseEditor";
import { getType, Types } from "utils/TypeHelpers";
import { Colors } from "constants/Colors";
import { Button } from "design-system-old";
import type FeatureFlags from "entities/FeatureFlags";

export const PluginImageWrapper = styled.div`
  height: 34px;
  width: 34px;
  padding: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${Colors.GREY_200};
  border-radius: 100%;
  margin-right: 8px;
  flex-shrink: 0;
  img {
    height: 100%;
    width: auto;
  }
`;

export const PluginImage = (props: any) => {
  return (
    <PluginImageWrapper>
      <img {...props} />
    </PluginImageWrapper>
  );
};

export const FormContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
`;

export const FormContainerBody = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  flex-grow: 1;
  overflow-y: auto;
  padding: 20px;
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
  border-bottom: 1px solid ${Colors.ALTO};
  padding-bottom: 24px;
  //margin-top: 16px;
`;

export const ActionWrapper = styled.div`
  display: flex;
`;

export const ActionButton = styled(Button)`
  &&& {
    width: auto;
    min-width: 74px;
    margin-right: 9px;
    min-height: 32px;

    & > span {
      max-width: 100%;
    }
  }
`;

export const EditDatasourceButton = styled(Button)`
  padding: 10px 20px;
  &&&& {
    height: 36px;
    max-width: 160px;
    border: 1px solid ${Colors.HIT_GRAY};
    width: auto;
  }
`;

export interface JSONtoFormProps {
  formData: Datasource;
  formName: string;
  formConfig: any[];
  datasourceId: string;
  isReconnectingModalOpen?: boolean;
  featureFlags?: FeatureFlags;
}

export class JSONtoForm<
  P = unknown,
  S = unknown,
  SS = any,
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
      } else {
        const value = _.get(values, fieldConfigProperty);

        if (_.isNil(value)) {
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
          _.set(formData, key, formData[key].trim());
        }
      });
    }
    return formData;
  };

  renderForm = (formContent: any) => {
    return (
      <FormContainer className="t--json-to-form-wrapper">
        <CloseEditor />
        <FormContainerBody className="t--json-to-form-body">
          {formContent}
        </FormContainerBody>
      </FormContainer>
    );
  };

  renderMainSection = (section: any, index: number) => {
    // hides features/configs that are hidden behind feature flag
    // TODO: remove hidden config property as well as this param,
    // when feature flag is removed
    if (isHidden(this.props.formData, section.hidden, this.props?.featureFlags))
      return null;
    return (
      <Collapsible
        defaultIsOpen={index === 0 || section?.isDefaultOpen}
        key={section.sectionName}
        showSection={index !== 0 && !section?.isDefaultOpen}
        showTopBorder={index !== 0 && !section?.isDefaultOpen}
        title={section.sectionName}
      >
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
          // hides features/configs that are hidden behind feature flag
          // TODO: remove hidden config property as well as this param,
          // when feature flag is removed
          if (
            isHidden(
              this.props.formData,
              section.hidden,
              this.props?.featureFlags,
            )
          )
            return null;
          if ("children" in propertyControlOrSection) {
            const { children } = propertyControlOrSection as any;
            if (isKVArray(children)) {
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
