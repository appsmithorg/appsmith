import React from "react";
import type { ControlType } from "constants/PropertyControlConstants";
import FormControl from "pages/Editor/FormControl";
import { TabPanel, TabsList, Tab } from "@appsmith/ads";
import BaseControl, { type ControlProps } from "../BaseControl";
import { HTTP_METHOD } from "PluginActionEditor/constants/CommonApiConstants";
import { API_EDITOR_TAB_TITLES } from "ee/constants/messages";
import { createMessage } from "ee/constants/messages";
import {
  CustomActionFormLayout,
  CUSTOM_ACTION_TABS,
  TabbedWrapper,
  useSyncParamsToPath,
} from "./common";

const TabbedControls = (props: ControlProps) => {
  // Use the hook to sync params with path
  useSyncParamsToPath(props.formName, props.configProperty);

  return (
    <TabbedWrapper defaultValue={CUSTOM_ACTION_TABS.HEADERS}>
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
    </TabbedWrapper>
  );
};

/**
 * This component is used to configure the custom actions for the external integration.
 * It allows the user to add or update details for the custom action like method type, path, headers, params, body.
 */
export class CustomActionsControl extends BaseControl<ControlProps> {
  getControlType(): ControlType {
    return "CUSTOM_ACTIONS_CONFIG_FORM";
  }
  render() {
    const { props } = this;

    return (
      <CustomActionFormLayout
        configProperty={props.configProperty}
        formName={props.formName}
        methodOptions={Object.values(HTTP_METHOD).map((method) => ({
          label: method,
          value: method,
        }))}
        pathPlaceholder="/v1/users"
      >
        <TabbedControls {...props} />
      </CustomActionFormLayout>
    );
  }
}
