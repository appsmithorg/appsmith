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
import type { FeatureFlags } from "@appsmith/entities/FeatureFlag";
import { useIsAppSidebarEnabled } from "../../../navigation/featureFlagHooks";

export const FormContainer = styled.div`
  display: flex;
  position: relative;
  height: 100%;
  overflow: hidden;
  flex: 1;
  flex-direction: column;
  width: 100%;
`;

export const FormContainerBody = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  flex-grow: 1;
  overflow: hidden;
  form {
    height: 100%;
  }
`;

export interface JSONtoFormProps {
  formData: Datasource;
  formName: string;
  formConfig: any[];
  datasourceId: string;
  featureFlags?: FeatureFlags;
  setupConfig: (config: ControlProps) => void;
  currentEnvironment: string;
}

export class JSONtoForm<
  P = unknown,
  S = unknown,
  SS = any,
> extends React.Component<JSONtoFormProps & P, S, SS> {
  renderForm = (formContent: any) => {
    const isAppSidebarEnabled = useIsAppSidebarEnabled();
    return (
      // <MainContainer>
      <FormContainer className="t--json-to-form-wrapper">
        {isAppSidebarEnabled === true ? null : <CloseEditor />}
        <FormContainerBody className="t--json-to-form-body">
          {formContent}
        </FormContainerBody>
      </FormContainer>
      // </MainContainer>
    );
  };

  renderMainSection = (section: any, index: number) => {
    if (
      !this.props.formData ||
      !this.props.formData.hasOwnProperty("datasourceStorages") ||
      !this.props.hasOwnProperty("currentEnvironment") ||
      !this.props.currentEnvironment ||
      !this.props.formData.datasourceStorages.hasOwnProperty(
        this.props.currentEnvironment,
      )
    ) {
      return null;
    }

    // hides features/configs that are hidden behind feature flag
    // TODO: remove hidden config property as well as this param,
    // when feature flag is removed
    if (
      isHidden(
        this.props.formData.datasourceStorages[this.props.currentEnvironment],
        section.hidden,
        this.props?.featureFlags,
        false, // viewMode is false here.
      )
    )
      return null;
    return (
      <Collapsible
        key={section.sectionName}
        showSectionHeader={index !== 0}
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
    const customConfig = {
      ...config,
      configProperty:
        `datasourceStorages.${this.props.currentEnvironment}.` +
        config.configProperty,
    };
    try {
      this.props.setupConfig(customConfig);
      return (
        <div key={customConfig.configProperty} style={{ marginTop: "16px" }}>
          <FormControl
            config={customConfig}
            formName={this.props.formName}
            multipleConfig={multipleConfig}
          />
        </div>
      );
    } catch (e) {
      log.error(e);
    }
  };

  renderKVArray = (children: Array<ControlProps>) => {
    try {
      // setup config for each child
      children.forEach((c) => this.props.setupConfig(c));
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
              this.props.formData.datasourceStorages[
                this.props.currentEnvironment
              ],
              propertyControlOrSection.hidden,
              this.props?.featureFlags,
              false,
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
