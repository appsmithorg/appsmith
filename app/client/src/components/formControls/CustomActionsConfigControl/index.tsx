import React, { useEffect, useRef, useCallback } from "react";
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
import get from "lodash/get";
import isEqual from "lodash/isEqual";

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

// Helper function to check if two arrays of params are functionally equivalent
const areParamsEquivalent = (
  params1: Property[],
  params2: Property[],
): boolean => {
  if (params1.length !== params2.length) return false;

  // Create a map of key-value pairs for easier comparison
  const paramsMap1 = params1.reduce(
    (map, param) => {
      if (param.key) map[param.key] = param.value;
      return map;
    },
    {} as Record<string, unknown>,
  );

  const paramsMap2 = params2.reduce(
    (map, param) => {
      if (param.key) map[param.key] = param.value;
      return map;
    },
    {} as Record<string, unknown>,
  );

  return isEqual(paramsMap1, paramsMap2);
};

// Hook to sync query parameters with URL path in both directions
const useSyncParamsToPath = (formName: string, configProperty: string) => {
  const dispatch = useDispatch();
  const formValues = useSelector((state) => getFormData(state, formName));
  // Refs to track the last values to prevent infinite loops
  const lastPathRef = useRef("");
  const lastParamsRef = useRef<Property[]>([]);

  // Extract the sync logic into a separate function so we can call it imperatively
  const syncParamsEffect = useCallback(() => {
    if (!formValues || !formValues.values) return;

    const values = formValues.values;
    const actionId = values.id;

    if (!actionId) return;

    // Correctly access nested properties using lodash's get
    const path = get(values, `${configProperty}.path`, "");
    const queryParameters = get(values, `${configProperty}.params`, []);

    // Early return if nothing has changed
    if (
      path === lastPathRef.current &&
      isEqual(queryParameters, lastParamsRef.current)
    ) {
      return;
    }

    // Check if params have changed but path hasn't - indicating params tab update
    const paramsChanged = !isEqual(queryParameters, lastParamsRef.current);
    const pathChanged = path !== lastPathRef.current;

    // Only one sync direction per effect execution to prevent loops

    // Path changed - update params from path if needed
    if (pathChanged) {
      // Update refs to reflect current path value before parsing
      lastPathRef.current = path;

      // Check if we need to extract parameters from the path
      const parsedParams = parseUrlForQueryParams(path);

      // We want to update params in two cases:
      // 1. URL has params and they differ from current params
      // 2. URL has no params but we have params in the form (need to clear them)
      const urlHasParams = path.includes("?");
      const shouldClearParams =
        !urlHasParams && queryParameters.some((p: Property) => p.key);
      const shouldUpdateParams =
        (parsedParams.length > 0 &&
          !areParamsEquivalent(parsedParams, queryParameters)) ||
        shouldClearParams;

      if (shouldUpdateParams) {
        // If URL has no params but we have params in the form, clear them
        const updatedParams = shouldClearParams ? [] : parsedParams;

        // Immediately update both the form and the action model
        dispatch(autofill(formName, `${configProperty}.params`, updatedParams));

        dispatch(
          setActionProperty({
            actionId: actionId,
            propertyName: `${configProperty}.params`,
            value: updatedParams,
          }),
        );

        // Update ref to reflect the change we just made
        lastParamsRef.current = updatedParams;
      } else {
        // Just update the ref without changing anything
        lastParamsRef.current = [...queryParameters];
      }

      return; // Exit to prevent double updates
    }

    // Params changed - update path from params if needed
    if (paramsChanged) {
      // Update refs to reflect current params before rebuilding path
      lastParamsRef.current = [...queryParameters];

      // Extract base path without query parameters
      const matchGroups = path.match(queryParamsRegEx) || [];
      const currentPath = matchGroups[1] || "";

      // Only build params string if we have any valid params
      const validParams = queryParameters.filter((p: Property) => p.key);

      // If we have valid params, build a new path with those params
      if (validParams.length > 0) {
        const paramsString = validParams
          .map(
            (p: Property, i: number) =>
              `${i === 0 ? "?" : "&"}${p.key}=${p.value}`,
          )
          .join("");

        // Create new path
        const newPath = `${currentPath}${paramsString}`;

        // Only update if path is actually different
        if (path !== newPath) {
          dispatch(autofill(formName, `${configProperty}.path`, newPath));
          dispatch(
            setActionProperty({
              actionId: actionId,
              propertyName: `${configProperty}.path`,
              value: newPath,
            }),
          );

          // Update ref to reflect the change we just made
          lastPathRef.current = newPath;
        }
      } else {
        // If no valid params, remove query part from path if it exists
        if (path.includes("?")) {
          const newPath = currentPath;

          dispatch(autofill(formName, `${configProperty}.path`, newPath));
          dispatch(
            setActionProperty({
              actionId: actionId,
              propertyName: `${configProperty}.path`,
              value: newPath,
            }),
          );

          // Update ref to reflect the change we just made
          lastPathRef.current = newPath;
        } else {
          // Just update the ref without changing anything
          lastPathRef.current = path;
        }
      }
    }
  }, [formValues, dispatch, formName, configProperty]);

  // Run effect on formValues change
  useEffect(() => {
    syncParamsEffect();
  }, [syncParamsEffect, formValues]);
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
