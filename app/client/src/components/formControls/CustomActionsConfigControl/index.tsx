import React, { useEffect } from "react";
import type { ControlType } from "constants/PropertyControlConstants";
import FormControl from "pages/Editor/FormControl";
import { Grid, Tabs, TabPanel, TabsList, Tab, Flex } from "@appsmith/ads";
import BaseControl, { type ControlProps } from "../BaseControl";
import { HTTP_METHOD } from "PluginActionEditor/constants/CommonApiConstants";
import { API_EDITOR_TAB_TITLES } from "ee/constants/messages";
import { createMessage } from "ee/constants/messages";
import styled from "styled-components";
import { useDispatch, useSelector } from "react-redux";
import { getFormData } from "selectors/formSelectors";
import { parseUrlForQueryParams, queryParamsRegEx } from "utils/ApiPaneUtils";
import { autofill } from "redux-form";
import { setActionProperty } from "actions/pluginActionActions";
import type { Property } from "api/ActionAPI";

enum CUSTOM_ACTION_TABS {
  HEADERS = "HEADERS",
  PARAMS = "PARAMS",
  BODY = "BODY",
}

const TabbedWrapper = styled(Tabs)`
  .t--form-control-KEYVALUE_ARRAY {
    & > div {
      margin-bottom: var(--ads-v2-spaces-3);
      & > * {
        flex-grow: 1;
      }
      & > *:first-child {
        max-width: 184px;
      }
      & > *:nth-child(2) {
        margin-left: var(--ads-v2-spaces-3);
      }
      & > .t--delete-field {
        max-width: 34px;
      }
    }
    & .t--add-field {
      height: 24px;
    }
  }
`;

// Hook to sync query parameters with URL path in both directions
const useSyncParamsToPath = (formName: string, configProperty: string) => {
  const dispatch = useDispatch();
  const formValues = useSelector((state) => getFormData(state, formName));

  useEffect(
    function syncParamsEffect() {
      if (!formValues || !formValues.values) return;

      const values = formValues.values;
      const actionId = values.id;

      if (!actionId) return;

      // Path to sync
      const path = values.actionConfiguration?.path || "";
      // Query parameters to sync
      const queryParameters = values.actionConfiguration?.queryParameters || [];

      // Check if we need to extract parameters from the path
      if (path) {
        const parsedParams = parseUrlForQueryParams(path);

        // If we found params in the path, but they're not in the params tab, update them
        if (
          parsedParams.length > 0 &&
          parsedParams.some((p) => p.key) &&
          (!queryParameters.length ||
            !queryParameters.some((p: Property) => p.key))
        ) {
          dispatch(
            autofill(
              formName,
              "actionConfiguration.queryParameters",
              parsedParams,
            ),
          );
          dispatch(
            setActionProperty({
              actionId: actionId,
              propertyName: "actionConfiguration.queryParameters",
              value: parsedParams,
            }),
          );
        }
      }

      // If we have query params but they're not in the path, update the path
      if (
        queryParameters.length &&
        queryParameters.some((p: Property) => p.key)
      ) {
        const matchGroups = path.match(queryParamsRegEx) || [];
        const currentPath = matchGroups[1] || "";
        // Only build params string if we have any valid params
        const validParams = queryParameters.filter((p: Property) => p.key);

        if (validParams.length > 0) {
          const paramsString = validParams
            .map(
              (p: Property, i: number) =>
                `${i === 0 ? "?" : "&"}${p.key}=${p.value}`,
            )
            .join("");

          // Don't update if already in sync (prevent loops)
          const newPath = `${currentPath}${paramsString}`;
          if (path !== newPath) {
            dispatch(autofill(formName, "actionConfiguration.path", newPath));
            dispatch(
              setActionProperty({
                actionId: actionId,
                propertyName: "actionConfiguration.path",
                value: newPath,
              }),
            );
          }
        }
      }
    },
    [formValues, dispatch, formName, configProperty],
  );
};

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
      <Flex flexDirection="column" gap="spaces-4">
        <Grid gap="spaces-4" gridTemplateColumns="100px 1fr">
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
      </Flex>
    );
  }
}
