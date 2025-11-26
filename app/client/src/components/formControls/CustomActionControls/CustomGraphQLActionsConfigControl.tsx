import React from "react";
import type { ControlType } from "constants/PropertyControlConstants";
import FormControl from "pages/Editor/FormControl";
import { TabPanel, TabsList, Tab } from "@appsmith/ads";
import BaseControl, { type ControlProps } from "../BaseControl";
import { GRAPHQL_HTTP_METHOD_OPTIONS } from "PluginActionEditor/constants/GraphQLEditorConstants";
import { API_EDITOR_TAB_TITLES } from "ee/constants/messages";
import { createMessage } from "ee/constants/messages";
import styled from "styled-components";
import { useSelector } from "react-redux";
import { getFormData } from "selectors/formSelectors";
import {
  CodeEditorBorder,
  EditorModes,
  EditorSize,
  EditorTheme,
  TabBehaviour,
} from "components/editorComponents/CodeEditor/EditorConfig";
import DynamicTextField from "components/editorComponents/form/fields/DynamicTextField";
import {
  Section,
  Zone,
} from "PluginActionEditor/components/PluginActionForm/components/ActionForm";
import { AutocompleteDataType } from "utils/autocomplete/AutocompleteDataType";
import FormLabel from "components/editorComponents/FormLabel";
import {
  CustomActionFormLayout,
  CUSTOM_ACTION_TABS,
  TabbedWrapper,
  useSyncParamsToPath,
} from "./common";

const GraphQLQueryContainer = styled.div`
  &&&& .CodeMirror {
    height: auto;
    min-height: 150px;
  }
`;

const StyledFormLabel = styled(FormLabel)`
  && {
    margin-bottom: var(--ads-v2-spaces-2);
    padding: 0;
  }
`;

const EXPECTED_VARIABLE = {
  type: "object",
  example: '{\n  "name": "{{ inputName.property }}"\n}',
  autocompleteDataType: AutocompleteDataType.OBJECT,
};

const TabbedControls = (props: ControlProps) => {
  // Use the hook to sync params with path
  useSyncParamsToPath(props.formName, props.configProperty);

  const formValues = useSelector((state) => getFormData(state, props.formName));
  const values = formValues?.values || {};
  const actionName = values.name || "";

  return (
    <TabbedWrapper defaultValue={CUSTOM_ACTION_TABS.HEADERS}>
      <TabsList>
        {Object.values(CUSTOM_ACTION_TABS).map((tab) => {
          let tabLabel: string = tab;

          if (tab === CUSTOM_ACTION_TABS.HEADERS) {
            tabLabel = createMessage(API_EDITOR_TAB_TITLES.HEADERS);
          } else if (tab === CUSTOM_ACTION_TABS.PARAMS) {
            tabLabel = createMessage(API_EDITOR_TAB_TITLES.PARAMS);
          } else if (tab === CUSTOM_ACTION_TABS.BODY) {
            tabLabel = createMessage(API_EDITOR_TAB_TITLES.BODY);
          }

          return (
            <Tab data-testid={`t--graphql-editor-${tab}`} key={tab} value={tab}>
              {tabLabel}
            </Tab>
          );
        })}
      </TabsList>

      <TabPanel value={CUSTOM_ACTION_TABS.HEADERS}>
        <FormControl
          config={{
            controlType: "KEYVALUE_ARRAY",
            configProperty: `${props.configProperty}.headers`,
            formName: props.formName,
            id: `${props.configProperty}.headers`,
            isValid: true,
            // @ts-expect-error FormControl component has incomplete TypeScript definitions for some valid properties
            showHeader: true,
          }}
          formName={props.formName}
        />
      </TabPanel>
      <TabPanel value={CUSTOM_ACTION_TABS.PARAMS}>
        <FormControl
          config={{
            controlType: "KEYVALUE_ARRAY",
            configProperty: `${props.configProperty}.params`,
            formName: props.formName,
            id: `${props.configProperty}.params`,
            // @ts-expect-error FormControl component has incomplete TypeScript definitions for some valid properties
            showHeader: true,
            isValid: true,
          }}
          formName={props.formName}
        />
      </TabPanel>
      <TabPanel value={CUSTOM_ACTION_TABS.BODY}>
        <GraphQLQueryContainer>
          <Section isFullWidth withoutPadding>
            <Zone layout="single_column">
              <div className="t--graphql-query-editor">
                <StyledFormLabel>Query</StyledFormLabel>
                <DynamicTextField
                  border={CodeEditorBorder.ALL_SIDE}
                  dataTreePath={`${actionName}.config.${props.configProperty}.body`}
                  evaluatedPopUpLabel={"Query"}
                  mode={EditorModes.GRAPHQL_WITH_BINDING}
                  name={`${props.configProperty}.body`}
                  placeholder={`query myQuery($name: String!) {\n  team(name: $name) {\n\tid\n\tname\n  }\n}`}
                  showLineNumbers
                  size={EditorSize.EXTENDED}
                  tabBehaviour={TabBehaviour.INDENT}
                  theme={EditorTheme.LIGHT}
                />
              </div>
            </Zone>
            <Zone layout="single_column">
              <div className="t--graphql-variable-editor">
                <StyledFormLabel>Query variables</StyledFormLabel>
                <DynamicTextField
                  border={CodeEditorBorder.ALL_SIDE}
                  dataTreePath={`${actionName}.config.${props.configProperty}.variables`}
                  evaluatedPopUpLabel={"Query variables"}
                  expected={EXPECTED_VARIABLE}
                  height="100%"
                  mode={EditorModes.JSON_WITH_BINDING}
                  name={`${props.configProperty}.variables`}
                  placeholder={`${EXPECTED_VARIABLE.example}\n\n\\\\Take widget inputs using {{ }}`}
                  showLightningMenu={false}
                  showLineNumbers
                  size={EditorSize.EXTENDED}
                  tabBehaviour={TabBehaviour.INDENT}
                  theme={EditorTheme.LIGHT}
                />
              </div>
            </Zone>
          </Section>
        </GraphQLQueryContainer>
      </TabPanel>
    </TabbedWrapper>
  );
};

/**
 * This component is used to configure the custom GraphQL actions for the external integration.
 * It allows the user to add or update details for the custom GraphQL action like method type, path, headers, params, query, and variables.
 */
export class CustomGraphQLActionsControl extends BaseControl<ControlProps> {
  getControlType(): ControlType {
    return "CUSTOM_GRAPHQL_ACTIONS_CONFIG_FORM";
  }
  render() {
    const { props } = this;

    return (
      <CustomActionFormLayout
        configProperty={props.configProperty}
        formName={props.formName}
        methodOptions={GRAPHQL_HTTP_METHOD_OPTIONS.map((method) => ({
          label: method.value,
          value: method.value,
        }))}
        pathPlaceholder="/graphql"
      >
        <TabbedControls {...props} />
      </CustomActionFormLayout>
    );
  }
}
