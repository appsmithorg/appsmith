import React, { useCallback, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import { Header, Body, Container } from "../common";
import {
  getIsJSModuleInstanceActionExecuting,
  getModuleInstanceActiveJSActionId,
  getModuleInstanceById,
  getModuleInstancePublicJSCollectionData,
} from "@appsmith/selectors/moduleInstanceSelectors";
import { getModuleById } from "@appsmith/selectors/modulesSelector";
import {
  setModuleInstanceActiveJSAction,
  updateModuleInstanceOnPageLoadSettings,
  updateModuleInstanceSettings,
} from "@appsmith/actions/moduleInstanceActions";
import Loader from "../../ModuleEditor/Loader";
import {
  hasExecuteModuleInstancePermission,
  hasManageModuleInstancePermission,
} from "@appsmith/utils/permissionHelpers";
import type { OnUpdateSettingsProps } from "pages/Editor/JSEditor/JSFunctionSettings";
import JSFunctionSettingsView, {
  SettingColumn,
} from "pages/Editor/JSEditor/JSFunctionSettings";
import { isEmpty, set, sortBy } from "lodash";
import { klona } from "klona";
import JSResponseView from "components/editorComponents/JSResponseView";
import type { JSAction } from "entities/JSCollection";
import { showDebuggerFlag } from "selectors/debuggerSelectors";
import type { AppState } from "@appsmith/reducers";
import equal from "fast-deep-equal/es6";
import { getJSCollectionParseErrors } from "@appsmith/selectors/entitiesSelector";
import { EditorTheme } from "components/editorComponents/CodeEditor/EditorConfig";
import { JSFunctionRun } from "pages/Editor/JSEditor/JSFunctionRun";
import type { JSActionDropdownOption } from "pages/Editor/JSEditor/utils";
import {
  convertJSActionToDropdownOption,
  convertJSActionsToDropdownOptions,
  getActionFromJsCollection,
  getJSActionOption,
} from "pages/Editor/JSEditor/utils";
import type { DropdownOnSelect } from "design-system-old";
import type { EventLocation } from "@appsmith/utils/analyticsUtilTypes";
import { startExecutingJSFunction } from "actions/jsPaneActions";
import styled from "styled-components";
import { Text } from "design-system";
import { extractFunctionParams } from "./utils";

export interface JSModuleInstanceEditorProps {
  moduleInstanceId: string;
}

const StyledJSFunctionRunWrapper = styled.div`
  .ads-v2-select {
    background-color: white;
  }
`;

const additionalHeadings = [
  {
    text: "Parameters",
    hasInfo: true,
    info: "List of params in the function definition",
    key: "params",
  },
];

function JSModuleInstanceEditor({
  moduleInstanceId,
}: JSModuleInstanceEditorProps) {
  const dispatch = useDispatch();
  const [activeResponse, setActiveResponse] = useState<JSAction | null>(null);

  const showDebugger = useSelector(showDebuggerFlag);
  const moduleInstance = useSelector((state) =>
    getModuleInstanceById(state, moduleInstanceId),
  );
  const module = useSelector((state) =>
    getModuleById(state, moduleInstance?.sourceModuleId || ""),
  );
  const publicJSCollectionData = useSelector((state) =>
    getModuleInstancePublicJSCollectionData(state, moduleInstanceId),
  );
  const publicJSCollection = publicJSCollectionData?.config;
  const parseErrors = useSelector(
    (state: AppState) =>
      getJSCollectionParseErrors(state, publicJSCollection?.name || ""),
    equal,
  );
  const activeJSActionId = useSelector((state: AppState) =>
    getModuleInstanceActiveJSActionId(state, publicJSCollection?.id || ""),
  );
  const isExecutingCurrentJSAction = useSelector((state: AppState) =>
    getIsJSModuleInstanceActionExecuting(
      state,
      moduleInstanceId,
      activeJSActionId,
    ),
  );
  const activeJSAction = publicJSCollection
    ? getActionFromJsCollection(activeJSActionId, publicJSCollection)
    : null;

  const sortedJSactions = sortBy(publicJSCollection?.actions, ["name"]);

  const [selectedJSActionOption, setSelectedJSActionOption] =
    useState<JSActionDropdownOption>(
      getJSActionOption(activeJSAction, sortedJSactions),
    );

  const isExecutePermitted = hasExecuteModuleInstancePermission(
    moduleInstance?.userPermissions,
  );

  const canManageModuleInstance = hasManageModuleInstancePermission(
    moduleInstance?.userPermissions,
  );

  const renderParamsColumns = useCallback(
    (action: JSAction) => {
      const params = extractFunctionParams(action.actionConfiguration.body);

      return (
        <SettingColumn>
          <Text>{params.join(", ")}</Text>
        </SettingColumn>
      );
    },
    [publicJSCollection],
  );

  if (!moduleInstance || !module || !publicJSCollection) {
    return <Loader />;
  }

  const onUpdateSettings = (props: OnUpdateSettingsProps) => {
    if (
      props.propertyName === "executeOnLoad" &&
      typeof props.value === "boolean"
    ) {
      dispatch(
        updateModuleInstanceOnPageLoadSettings({
          actionId: props.action.id,
          value: props.value,
        }),
      );
    } else {
      const updatedJSCollection = klona(publicJSCollection);
      const updatedAction = klona(props.action);

      set(updatedAction, props.propertyName, props.value);

      updatedJSCollection.actions = updatedJSCollection.actions.map((a) => {
        return a.id === updatedAction.id ? updatedAction : a;
      });

      dispatch(updateModuleInstanceSettings(updatedJSCollection));
    }
  };

  const handleJSActionOptionSelection: DropdownOnSelect = (value) => {
    if (value) {
      const jsAction = getActionFromJsCollection(value, publicJSCollection);
      if (jsAction) {
        setSelectedJSActionOption({
          data: jsAction,
          value,
          label: jsAction.name,
        });
      }
    }
  };

  const handleRunAction = (
    event: React.MouseEvent<HTMLElement, MouseEvent> | KeyboardEvent,
    from: EventLocation,
  ) => {
    event.preventDefault();
    if (
      !disableRunFunctionality &&
      !isExecutingCurrentJSAction &&
      selectedJSActionOption.data
    ) {
      const jsAction = selectedJSActionOption.data;
      setActiveResponse(jsAction);
      if (jsAction.id !== selectedJSActionOption.data?.id)
        setSelectedJSActionOption(convertJSActionToDropdownOption(jsAction));
      dispatch(
        setModuleInstanceActiveJSAction({
          jsCollectionId: publicJSCollection.id,
          jsActionId: jsAction.id,
        }),
      );
      dispatch(
        startExecutingJSFunction({
          action: jsAction,
          collection: publicJSCollection,
          from: from,
          openDebugger: true,
        }),
      );
    }
  };

  const disableRunFunctionality = Boolean(
    parseErrors.length || isEmpty(sortedJSactions),
  );

  return (
    <Container>
      <Header moduleInstance={moduleInstance}>
        {/* This is disabled on a temporary basis. Once the UX is finalized; this can be enabled */}

        <StyledJSFunctionRunWrapper>
          <JSFunctionRun
            disabled={disableRunFunctionality || !isExecutePermitted}
            isLoading={isExecutingCurrentJSAction}
            jsCollection={publicJSCollection}
            onButtonClick={(
              event: React.MouseEvent<HTMLElement, MouseEvent> | KeyboardEvent,
            ) => {
              handleRunAction(event, "JS_OBJECT_MAIN_RUN_BUTTON");
            }}
            onSelect={handleJSActionOptionSelection}
            options={convertJSActionsToDropdownOptions(sortedJSactions)}
            selected={selectedJSActionOption}
            showTooltip={!selectedJSActionOption.data}
          />
        </StyledJSFunctionRunWrapper>
      </Header>
      <Body>
        <JSFunctionSettingsView
          actions={sortedJSactions}
          additionalHeadings={additionalHeadings}
          disabled={!canManageModuleInstance}
          onUpdateSettings={onUpdateSettings}
          renderAdditionalColumns={renderParamsColumns}
        />
      </Body>
      {showDebugger ? (
        <JSResponseView
          currentFunction={activeResponse}
          disabled={disableRunFunctionality || !isExecutePermitted}
          errors={parseErrors}
          isLoading={isExecutingCurrentJSAction}
          jsCollectionData={publicJSCollectionData}
          onButtonClick={(
            event: React.MouseEvent<HTMLElement, MouseEvent> | KeyboardEvent,
          ) => {
            handleRunAction(event, "JS_OBJECT_RESPONSE_RUN_BUTTON");
          }}
          theme={EditorTheme.LIGHT}
        />
      ) : null}
    </Container>
  );
}

export default JSModuleInstanceEditor;
