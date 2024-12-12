import React from "react";
import {
  ACTION_EDITOR_REFRESH,
  createMessage,
  INVALID_FORM_CONFIGURATION,
  UNEXPECTED_ERROR,
} from "ee/constants/messages";
import { Tag } from "@blueprintjs/core";
import styled from "styled-components";
import { UIComponentTypes } from "api/PluginApi";
import log from "loglevel";
import * as Sentry from "@sentry/react";
import type { FormEvalOutput } from "reducers/evaluationReducers/formEvaluationReducer";
import {
  checkIfSectionCanRender,
  checkIfSectionIsEnabled,
  extractConditionalOutput,
  isHidden,
  modifySectionConfig,
  updateEvaluatedSectionConfig,
} from "components/formControls/utils";
import { isValidFormConfig } from "reducers/evaluationReducers/formEvaluationReducer";
import FormControl from "pages/Editor/FormControl";
import type { ControlProps } from "components/formControls/BaseControl";
import { Spinner, Text } from "@appsmith/ads";
import CenteredWrapper from "components/designSystems/appsmith/CenteredWrapper";
import type { QueryAction, SaaSAction } from "entities/Action";
import { Section, Zone } from "../ActionForm";

interface Props {
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  editorConfig?: any;
  uiComponent: UIComponentTypes;
  formEvaluationState: FormEvalOutput;
  formName: string;
  formData: SaaSAction | QueryAction;
}

const ErrorMessage = styled.p`
  font-size: 14px;
  color: var(--ads-v2-color-fg-error);
  display: inline-block;
  margin-right: 10px;
`;

const ErrorComponent = (props: { errorMessage: string }) => {
  return (
    <>
      <ErrorMessage>{props.errorMessage}</ErrorMessage>
      <Tag
        intent="warning"
        interactive
        minimal
        onClick={() => window.location.reload()}
        round
      >
        {createMessage(ACTION_EDITOR_REFRESH)}
      </Tag>
    </>
  );
};

const StyledSpinner = styled(Spinner)`
  display: flex;
  height: 2vw;
  align-items: center;
  justify-content: space-between;
  width: 5vw;
`;

const FieldWrapper = styled.div`
  margin-top: 15px;
`;

const FormRender = (props: Props) => {
  const { editorConfig, formData, formEvaluationState, formName, uiComponent } =
    props;
  // function to handle the render of the configs
  const renderConfig = () => {
    try {
      // Selectively rendering form based on uiComponent prop
      if (
        uiComponent === UIComponentTypes.UQIDbEditorForm ||
        uiComponent === UIComponentTypes.DbEditorForm
      ) {
        // If the formEvaluation is not ready yet, just show loading state.
        if (
          props.hasOwnProperty("formEvaluationState") &&
          !!formEvaluationState &&
          Object.keys(formEvaluationState).length > 0
        ) {
          // TODO: Fix this the next time the file is edited
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          return editorConfig.map((config: any, idx: number) => {
            return renderEachConfigV2(formName, config, idx);
          });
        } else {
          return <StyledSpinner size="md" />;
        }
      } else {
        return editorConfig.map(renderEachConfig(formName));
      }
    } catch (e) {
      log.error(e);
      Sentry.captureException(e);

      return (
        <ErrorComponent
          errorMessage={createMessage(INVALID_FORM_CONFIGURATION)}
        />
      );
    }
  };

  // Render function to render the V2 of form editor type (UQI)
  // Section argument is a nested config object, this function recursively renders the UI based on the config
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const renderEachConfigV2 = (formName: string, section: any, idx: number) => {
    let enabled = true;

    if (!!section) {
      // If the section is a nested component, recursively check for conditional statements
      if (
        "schema" in section &&
        Array.isArray(section.schema) &&
        section.schema.length > 0
      ) {
        // TODO: Fix this the next time the file is edited
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        section.schema = section.schema.map((subSection: any) => {
          const conditionalOutput = extractConditionalOutput(
            subSection,
            props.formEvaluationState,
          );

          if (!checkIfSectionCanRender(conditionalOutput)) {
            subSection.hidden = true;
          } else {
            subSection.hidden = false;
          }

          enabled = checkIfSectionIsEnabled(conditionalOutput);
          subSection = updateEvaluatedSectionConfig(
            subSection,
            conditionalOutput,
            enabled,
          );

          if (!isValidFormConfig(subSection)) return null;

          return subSection;
        });
      }

      // If the component is not allowed to render, return null
      const conditionalOutput = extractConditionalOutput(
        section,
        props.formEvaluationState,
      );

      if (!checkIfSectionCanRender(conditionalOutput)) return null;

      section = updateEvaluatedSectionConfig(section, conditionalOutput);
      enabled = checkIfSectionIsEnabled(conditionalOutput);

      if (!isValidFormConfig(section)) return null;
    }

    if (section.hasOwnProperty("controlType")) {
      // If component is type section, render it's children
      if (Object.hasOwn(section, "children")) {
        return renderNodeWithChildren(section, formName);
      }

      try {
        const { configProperty } = section;
        const modifiedSection = modifySectionConfig(section, enabled);

        return (
          // TODO: Remove classname once action redesign epic is done
          <FieldWrapper
            className="uqi-form-wrapper"
            key={`${configProperty}_${idx}`}
          >
            <FormControl config={modifiedSection} formName={formName} />
          </FieldWrapper>
        );
      } catch (e) {
        log.error(e);
      }
    } else {
      // TODO: Fix this the next time the file is edited
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return section.map((section: any, idx: number) => {
        renderEachConfigV2(formName, section, idx);
      });
    }

    return null;
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const renderNodeWithChildren = (section: any, formName: string) => {
    if (!Object.hasOwn(section, "children")) return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const children = section.children.map((section: any, idx: number) =>
      renderEachConfigV2(formName, section, idx),
    );

    switch (section.controlType) {
      case "SECTION_V2":
        return <Section isFullWidth={section.isFullWidth}>{children}</Section>;

      case "SINGLE_COLUMN_ZONE":
      case "DOUBLE_COLUMN_ZONE": {
        const layout =
          section.controlType === "SINGLE_COLUMN_ZONE"
            ? "single_column"
            : "double_column";

        return <Zone layout={layout}>{children}</Zone>;
      }
      default:
        return children;
    }
  };

  // Recursive call to render forms pre UQI
  const renderEachConfig =
    (formName: string) =>
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (section: any): any => {
      return section.children.map(
        (formControlOrSection: ControlProps, idx: number) => {
          if (isHidden(formData, section.hidden, undefined, false)) return null;

          if (formControlOrSection.hasOwnProperty("children")) {
            return renderEachConfig(formName)(formControlOrSection);
          } else {
            try {
              const { configProperty } = formControlOrSection;

              return (
                <FieldWrapper
                  className="uqi-form-wrapper"
                  key={`${configProperty}_${idx}`}
                >
                  <FormControl
                    config={formControlOrSection}
                    formName={formName}
                  />
                </FieldWrapper>
              );
            } catch (e) {
              log.error(e);
            }
          }

          return null;
        },
      );
    };

  if (!editorConfig || editorConfig.length < 0) {
    return (
      <CenteredWrapper>
        <Text color="var(--ads-v2-color-fg-error)" kind="heading-m">
          {createMessage(UNEXPECTED_ERROR)}
        </Text>
      </CenteredWrapper>
    );
  }

  return renderConfig();
};

export default FormRender;
