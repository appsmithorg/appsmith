import React from "react";
import type { ControlProps } from "components/formControls/BaseControl";
import FormControl from "./FormControl";
import log from "loglevel";
import type { EditorTheme } from "components/editorComponents/CodeEditor/EditorConfig";
import styled from "styled-components";
import { Text } from "@appsmith/ads";
import CenteredWrapper from "../../components/designSystems/appsmith/CenteredWrapper";

interface ActionSettingsProps {
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  actionSettingsConfig: any;
  formName: string;
  theme?: EditorTheme;
}

const ActionSettingsWrapper = styled.div`
  width: 100%;
  max-width: 600px;
  padding-bottom: 1px;
  display: flex;
  flex-direction: column;
  gap: var(--ads-v2-spaces-4);

  .t--form-control-SWITCH {
    display: flex;
    flex-shrink: 0;
    align-items: center;
    margin-left: 24px;
  }

  .form-config-top {
    flex-grow: 1;
    .form-label {
      min-width: unset;
      width: 100%;
      line-height: 1.43;
    }
  }
`;

function ActionSettings(props: ActionSettingsProps): JSX.Element {
  /* @ts-expect-error: Types are not available */
  if (typeof window.Cypress?.log === "function") {
    /* @ts-expect-error: Types are not available */
    window.Cypress.log({
      message: `props.actionSettingsConfig, ${JSON.stringify(props.actionSettingsConfig || {})}`,
    });
  }

  return (
    <ActionSettingsWrapper>
      {!props.actionSettingsConfig ? (
        <CenteredWrapper>
          <Text color="var(--ads-v2-color-fg-error)" kind="heading-m">
            Error: No settings config found
          </Text>
        </CenteredWrapper>
      ) : (
        /* TODO: Fix this the next time the file is edited */
        /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
        props.actionSettingsConfig.map((section: any) =>
          renderEachConfig(section, props.formName),
        )
      )}
    </ActionSettingsWrapper>
  );
}

// TODO: Fix this the next time the file is edited
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const renderEachConfig = (section: any, formName: string): any => {
  return section.children.map((formControlOrSection: ControlProps) => {
    if ("children" in formControlOrSection) {
      return renderEachConfig(formControlOrSection, formName);
    } else {
      try {
        const { configProperty } = formControlOrSection;

        return (
          <FormControl
            config={formControlOrSection}
            formName={formName}
            key={configProperty}
          />
        );
      } catch (e) {
        log.error(e);
      }
    }

    return null;
  });
};

export default ActionSettings;
