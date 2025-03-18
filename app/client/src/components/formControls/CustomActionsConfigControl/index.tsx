import React from "react";
import type { ControlType } from "constants/PropertyControlConstants";
import FormControl from "pages/Editor/FormControl";
import { Grid, Tabs, TabPanel, TabsList, Tab } from "@appsmith/ads";
import BaseControl, { type ControlProps } from "../BaseControl";
import { HTTP_METHOD } from "PluginActionEditor/constants/CommonApiConstants";
import { API_EDITOR_TAB_TITLES } from "ee/constants/messages";
import { createMessage } from "ee/constants/messages";

enum CUSTOM_ACTION_TABS {
  HEADERS = "HEADERS",
  PARAMS = "PARAMS",
  BODY = "BODY",
}

const TabbedControls = (props: ControlProps) => {
  return (
    <Tabs defaultValue={CUSTOM_ACTION_TABS.HEADERS}>
      <TabsList>
        {Object.values(CUSTOM_ACTION_TABS).map((tab) => (
          <Tab data-testid={`t--api-editor-${tab}`} key={tab} value={tab}>
            {createMessage(API_EDITOR_TAB_TITLES[tab])}
          </Tab>
        ))}
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
        <FormControl
          config={{
            controlType: "QUERY_DYNAMIC_TEXT",
            configProperty: `${props.configProperty}.body`,
            formName: props.formName,
            id: `${props.configProperty}.body`,
            label: "",
            isValid: true,
          }}
          formName={props.formName}
        />
      </TabPanel>
    </Tabs>
  );
};

/**
 * This component is used to configure the function calling for the AI assistant.
 * It allows the user to add, edit and delete functions that can be used by the AI assistant.
 */
export class CustomActionsControl extends BaseControl<ControlProps> {
  getControlType(): ControlType {
    return "CUSTOM_ACTIONS_CONFIG_FORM";
  }
  render() {
    const { props } = this;

    return (
      <Grid gap="spaces-4" w="100%">
        <Grid gap="spaces-4" gridTemplateColumns="100px 1fr" w="100%">
          <FormControl
            config={{
              controlType: "DROP_DOWN",
              configProperty: `${props.configProperty}.method`,
              formName: props.formName,
              id: `${props.configProperty}.method`,
              label: "",
              isValid: true,
              // @ts-expect-error FormControl component has incomplete TypeScript definitions for some valid properties
              options: Object.values(HTTP_METHOD).map((method) => ({
                label: method,
                value: method,
              })),
            }}
            formName={props.formName}
          />
          <FormControl
            config={{
              controlType: "QUERY_DYNAMIC_INPUT_TEXT",
              configProperty: `${props.configProperty}.path`,
              formName: props.formName,
              id: `${props.configProperty}.path`,
              label: "",
              isValid: true,
              placeholderText: "/v1/users",
            }}
            formName={props.formName}
          />
        </Grid>
        <TabbedControls {...props} />
      </Grid>
    );
  }
}
