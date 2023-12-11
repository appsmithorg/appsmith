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
  getJSCollections,
  getModuleInstances,
  getPlugins,
} from "@appsmith/selectors/entitiesSelector";
import store from "store";
import keyBy from "lodash/keyBy";
import { getCurrentPageId } from "selectors/editorSelectors";
import { getApiQueriesAndJSActionOptionsWithChildren } from "components/editorComponents/ActionCreator/helpers";
import { selectEvaluationVersion } from "@appsmith/selectors/applicationSelectors";
import type { ModuleInstanceDataState } from "@appsmith/constants/ModuleInstanceConstants";
import { MODULE_TYPE } from "@appsmith/constants/ModuleConstants";

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

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  static canDisplayValueInUI(config: ControlData, value: any): boolean {
    const state = store.getState();
    const actions = getActions(state);
    const jsActions = getJSCollections(state);
    const codeFromProperty = getCodeFromMoustache(value?.trim() || "");
    const evaluationVersion = selectEvaluationVersion(state);
    const moduleInstances = getModuleInstances(state);

    const queryModuleInstances = Object.values(moduleInstances).map(
      (instance) => {
        if (instance.type === MODULE_TYPE.QUERY) {
          return {
            config: instance,
            data: undefined,
          };
        }
      },
    ) as unknown as ModuleInstanceDataState;

    const actionsArray: string[] = [];
    const jsActionsArray: string[] = [];
    const queryModuleInstanceArray: string[] = [];

    actions.forEach((action) => {
      actionsArray.push(action.config.name + ".run");
      actionsArray.push(action.config.name + ".clear");
    });

    jsActions.forEach((jsAction) =>
      jsAction.config.actions.forEach((action) => {
        jsActionsArray.push(jsAction.config.name + "." + action.name);
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
    const pluginGroups: any = keyBy(plugins, "id");

    // this function gets all the Queries/API's/JS Objects and attaches it to actionList
    const fieldOptions = getApiQueriesAndJSActionOptionsWithChildren(
      pageId,
      pluginGroups,
      actions,
      jsActions,
      () => {
        return;
      },
      () => {
        return;
      },
      queryModuleInstances,
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
