import React from "react";
import type { ControlData, ControlProps } from "./BaseControl";
import BaseControl from "./BaseControl";
// import DynamicActionCreator from "components/editorComponents/DynamicActionCreator";
import ActionCreator from "components/editorComponents/ActionCreator";
import type { DSEventDetail } from "utils/AppsmithUtils";
import {
  DSEventTypes,
  DS_EVENT,
  emitInteractionAnalyticsEvent,
} from "utils/AppsmithUtils";
import {
  codeToAction,
  getCodeFromMoustache,
} from "components/editorComponents/ActionCreator/utils";
import { canTranslateToUI, getActionBlocks } from "@shared/ast";
import {
  getActions,
  getAllJSCollections,
  getJSModuleInstancesData,
  getModuleInstances,
  getPlugins,
} from "ee/selectors/entitiesSelector";
import store from "store";
import { getCurrentPageId } from "selectors/editorSelectors";
import { getApiQueriesAndJSActionOptionsWithChildren } from "components/editorComponents/ActionCreator/helpers";
import { selectEvaluationVersion } from "ee/selectors/applicationSelectors";
import type {
  ModuleInstance,
  ModuleInstanceDataState,
} from "ee/constants/ModuleInstanceConstants";
import { MODULE_TYPE } from "ee/constants/ModuleConstants";
import type { JSAction } from "entities/JSCollection";
import { getAllModules } from "ee/selectors/modulesSelector";

class ActionSelectorControl extends BaseControl<ControlProps> {
  componentRef = React.createRef<HTMLDivElement>();

  componentDidMount() {
    this.componentRef.current?.addEventListener(
      DS_EVENT,
      this.handleAdsEvent as (arg0: Event) => void,
    );
  }

  componentWillUnmount() {
    this.componentRef.current?.removeEventListener(
      DS_EVENT,
      this.handleAdsEvent as (arg0: Event) => void,
    );
  }

  handleAdsEvent = (e: CustomEvent<DSEventDetail>) => {
    if (
      e.detail.component === "TreeDropdown" &&
      e.detail.event === DSEventTypes.KEYPRESS
    ) {
      emitInteractionAnalyticsEvent(this.componentRef.current, {
        key: e.detail.meta.key,
      });
      e.stopPropagation();
    }
  };

  handleValueUpdate = (newValue: string, isUpdatedViaKeyboard = false) => {
    const { propertyName, propertyValue } = this.props;

    if (!propertyValue && !newValue) return;

    this.updateProperty(propertyName, newValue, isUpdatedViaKeyboard);
  };

  render() {
    const {
      dataTreePath,
      label,
      propertyName,
      propertyValue,
      widgetProperties,
    } = this.props;

    return (
      <ActionCreator
        action={label}
        additionalAutoComplete={this.props.additionalAutoComplete}
        additionalControlData={
          // TODO: Fix this the next time the file is edited
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          this.props.additionalControlData as Record<string, any>
        }
        dataTreePath={dataTreePath}
        onValueChange={this.handleValueUpdate}
        propertyName={propertyName}
        ref={this.componentRef}
        value={propertyValue}
        widgetName={widgetProperties.widgetName}
        widgetType={widgetProperties.type}
      />
    );
  }

  static getControlType() {
    return "ACTION_SELECTOR";
  }

  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static canDisplayValueInUI(_: ControlData, value: any): boolean {
    const state = store.getState();
    const actions = getActions(state);
    const jsCollections = getAllJSCollections(state);
    const codeFromProperty = getCodeFromMoustache(value?.trim() || "");
    const evaluationVersion = selectEvaluationVersion(state);
    const moduleInstances = getModuleInstances(state);
    const queryModuleInstances = [] as ModuleInstanceDataState;
    const jsModuleInstances = getJSModuleInstancesData(state);
    const modules = getAllModules(state);

    if (!!moduleInstances) {
      for (const moduleInstance of Object.values(moduleInstances)) {
        const instance = moduleInstance as ModuleInstance;

        if (instance.type === MODULE_TYPE.QUERY) {
          queryModuleInstances.push({
            config: instance,
            data: undefined,
            isLoading: false,
          });
        }
      }
    }

    const actionsArray: string[] = [];
    const jsActionsArray: string[] = [];
    const queryModuleInstanceArray: string[] = [];

    actions.forEach((action) => {
      actionsArray.push(action.config.name + ".run");
      actionsArray.push(action.config.name + ".clear");
    });

    jsCollections.forEach((jsCollection) =>
      jsCollection.config.actions.forEach((action: JSAction) => {
        jsActionsArray.push(jsCollection.config.name + "." + action.name);
      }),
    );

    queryModuleInstances.forEach((instance) => {
      queryModuleInstanceArray.push(instance.config.name + ".run");
      queryModuleInstanceArray.push(instance.config.name + ".clear");
    });

    const canTranslate = canTranslateToUI(codeFromProperty, evaluationVersion);

    if (codeFromProperty.trim() && !canTranslate) {
      return false;
    }

    const pageId = getCurrentPageId(state);
    const plugins = getPlugins(state);

    // this function gets all the Queries/API's/JS Objects and attaches it to actionList
    const fieldOptions = getApiQueriesAndJSActionOptionsWithChildren(
      pageId,
      plugins,
      actions,
      jsCollections,
      () => {
        return;
      },
      () => {
        return;
      },
      queryModuleInstances,
      jsModuleInstances,
      modules,
    );

    try {
      const blocks = getActionBlocks(codeFromProperty, evaluationVersion);

      for (const codeBlock of blocks) {
        codeToAction(codeBlock, fieldOptions, true, true);
      }
    } catch (e) {
      return false;
    }

    return true;
  }
}

export default ActionSelectorControl;
