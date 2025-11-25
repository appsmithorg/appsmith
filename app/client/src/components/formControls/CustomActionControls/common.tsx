import React, { useCallback, useEffect, useRef } from "react";
import type { ReactNode } from "react";
import styled from "styled-components";
import { Flex, Grid, Tabs } from "@appsmith/ads";
import { useDispatch, useSelector } from "react-redux";
import { getFormData } from "selectors/formSelectors";
import { parseUrlForQueryParams, queryParamsRegEx } from "utils/ApiPaneUtils";
import { autofill } from "redux-form";
import { setActionProperty } from "actions/pluginActionActions";
import type { Property } from "api/ActionAPI";
import get from "lodash/get";
import isEqual from "lodash/isEqual";
import FormControl from "pages/Editor/FormControl";

export enum CUSTOM_ACTION_TABS {
  HEADERS = "HEADERS",
  PARAMS = "PARAMS",
  BODY = "BODY",
}

export const TabbedWrapper = styled(Tabs)`
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

const areParamsEquivalent = (
  params1: Property[],
  params2: Property[],
): boolean => {
  if (params1.length !== params2.length) return false;

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

export const useSyncParamsToPath = (
  formName: string,
  configProperty: string,
) => {
  const dispatch = useDispatch();
  const formValues = useSelector((state) => getFormData(state, formName));
  const lastPathRef = useRef("");
  const lastParamsRef = useRef<Property[]>([]);

  const syncParamsEffect = useCallback(() => {
    if (!formValues || !formValues.values) return;

    const values = formValues.values;
    const actionId = values.id;

    if (!actionId) return;

    const path = get(values, `${configProperty}.path`, "");
    const queryParameters = get(values, `${configProperty}.params`, []);

    if (
      path === lastPathRef.current &&
      isEqual(queryParameters, lastParamsRef.current)
    ) {
      return;
    }

    const paramsChanged = !isEqual(queryParameters, lastParamsRef.current);
    const pathChanged = path !== lastPathRef.current;

    if (pathChanged) {
      lastPathRef.current = path;

      const parsedParams = parseUrlForQueryParams(path);

      const urlHasParams = path.includes("?");
      const shouldClearParams =
        !urlHasParams && queryParameters.some((p: Property) => p.key);
      const shouldUpdateParams =
        (parsedParams.length > 0 &&
          !areParamsEquivalent(parsedParams, queryParameters)) ||
        shouldClearParams;

      if (shouldUpdateParams) {
        const updatedParams = shouldClearParams ? [] : parsedParams;

        dispatch(autofill(formName, `${configProperty}.params`, updatedParams));

        dispatch(
          setActionProperty({
            actionId: actionId,
            propertyName: `${configProperty}.params`,
            value: updatedParams,
          }),
        );

        lastParamsRef.current = updatedParams;
      } else {
        lastParamsRef.current = [...queryParameters];
      }

      return;
    }

    if (paramsChanged) {
      lastParamsRef.current = [...queryParameters];

      const matchGroups = path.match(queryParamsRegEx) || [];
      const currentPath = matchGroups[1] || "";

      const validParams = queryParameters.filter((p: Property) => p.key);

      if (validParams.length > 0) {
        const paramsString = validParams
          .map(
            (p: Property, i: number) =>
              `${i === 0 ? "?" : "&"}${p.key}=${p.value}`,
          )
          .join("");

        const newPath = `${currentPath}${paramsString}`;

        if (path !== newPath) {
          dispatch(autofill(formName, `${configProperty}.path`, newPath));
          dispatch(
            setActionProperty({
              actionId: actionId,
              propertyName: `${configProperty}.path`,
              value: newPath,
            }),
          );

          lastPathRef.current = newPath;
        }
      } else {
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

          lastPathRef.current = newPath;
        } else {
          lastPathRef.current = path;
        }
      }
    }
  }, [formValues, dispatch, formName, configProperty]);

  useEffect(() => {
    syncParamsEffect();
  }, [syncParamsEffect, formValues]);
};

interface MethodOption {
  label: string;
  value: string;
}

interface CustomActionFormLayoutProps {
  children: ReactNode;
  configProperty: string;
  formName: string;
  methodOptions: MethodOption[];
  pathPlaceholder: string;
}

export const CustomActionFormLayout = ({
  children,
  configProperty,
  formName,
  methodOptions,
  pathPlaceholder,
}: CustomActionFormLayoutProps) => {
  return (
    <Flex flexDirection="column" gap="spaces-4">
      <Grid gap="spaces-4" gridTemplateColumns="100px 1fr">
        <FormControl
          config={{
            controlType: "DROP_DOWN",
            configProperty: `${configProperty}.method`,
            formName: formName,
            id: `${configProperty}.method`,
            label: "",
            isValid: true,
            // @ts-expect-error FormControl component has incomplete TypeScript definitions for some valid properties
            options: methodOptions,
          }}
          formName={formName}
        />
        <FormControl
          config={{
            controlType: "QUERY_DYNAMIC_INPUT_TEXT",
            configProperty: `${configProperty}.path`,
            formName: formName,
            id: `${configProperty}.path`,
            label: "",
            isValid: true,
            placeholderText: pathPlaceholder,
          }}
          formName={formName}
        />
      </Grid>
      {children}
    </Flex>
  );
};
