import React from "react";
import type { WidgetProps } from "./BaseWidget";
import { debounce, fromPairs, isEmpty } from "lodash";
import { EditorContext } from "components/editorComponents/EditorContextProvider";
import AppsmithConsole from "utils/AppsmithConsole";
import { ENTITY_TYPE } from "ee/entities/AppsmithConsole/utils";
import LOG_TYPE from "entities/AppsmithConsole/logtype";
import type { ExecuteTriggerPayload } from "constants/AppsmithActionConstants/ActionConstants";
import { connect } from "react-redux";
import { getWidgetMetaProps } from "sagas/selectors";
import type { AppState } from "ee/reducers";
import { error } from "loglevel";
import WidgetFactory from "WidgetProvider/factory";
import type BaseWidget from "./BaseWidget";

export type pushAction = (
  propertyName: string | batchUpdateWidgetMetaPropertyType,
  propertyValue?: unknown,
  actionExecution?: DebouncedExecuteActionPayload,
) => void;

export type DebouncedExecuteActionPayload = Omit<
  ExecuteTriggerPayload,
  "dynamicString"
> & {
  dynamicString?: string;
};
export type batchUpdateWidgetMetaPropertyType = {
  propertyName: string;
  propertyValue: unknown;
  actionExecution?: DebouncedExecuteActionPayload;
}[];

export interface WithMeta {
  commitBatchMetaUpdates: () => void;
  pushBatchMetaUpdates: pushAction;
  updateWidgetMetaProperty: (
    propertyName: string,
    propertyValue: unknown,
    actionExecution?: DebouncedExecuteActionPayload,
  ) => void;
}

interface WidgetMetaProps {
  metaState: Record<string, unknown>;
}

type metaHOCProps = WidgetProps & WidgetMetaProps;

function withMeta(WrappedWidget: typeof BaseWidget) {
  class MetaHOC extends React.PureComponent<metaHOCProps> {
    static contextType = EditorContext;
    context!: React.ContextType<typeof EditorContext>;

    initialMetaState: Record<string, unknown>;
    actionsToExecute: Record<string, DebouncedExecuteActionPayload>;
    batchMetaUpdates: batchUpdateWidgetMetaPropertyType;
    updatedProperties: Record<string, boolean>;

    constructor(props: metaHOCProps) {
      super(props);
      const metaProperties = WidgetFactory.getWidgetMetaPropertiesMap(
        WrappedWidget.type,
      );

      this.initialMetaState = fromPairs(
        Object.entries(metaProperties).map(([key, value]) => {
          return [key, value];
        }),
      );
      this.updatedProperties = {};
      this.actionsToExecute = {};
      this.batchMetaUpdates = [];
    }

    addPropertyForEval = (
      propertyName: string,
      actionExecution?: DebouncedExecuteActionPayload,
    ) => {
      // Add meta updates in updatedProperties to push to evaluation
      this.updatedProperties[propertyName] = true;

      if (actionExecution) {
        // Adding action inside actionsToExecute
        this.actionsToExecute[propertyName] = actionExecution;
      }
    };

    removeBatchActions = (propertyName: string) => {
      delete this.actionsToExecute[propertyName];
    };

    runBatchActions = () => {
      const { executeAction } = this.context;
      const batchActionsToRun = Object.entries(this.actionsToExecute);

      batchActionsToRun.map(([propertyName, actionExecution]) => {
        if (actionExecution && actionExecution.dynamicString && executeAction) {
          executeAction({
            ...actionExecution,
            dynamicString: actionExecution.dynamicString, // when we spread the object above check of dynamic string doesn't account for type.
            source: {
              id: this.props.widgetId,
              name: this.props.widgetName,
              entityType: ENTITY_TYPE.WIDGET,
            },
          });

          // remove action from batch
          this.removeBatchActions(propertyName);

          actionExecution.triggerPropertyName &&
            AppsmithConsole.info({
              text: `${actionExecution.triggerPropertyName} triggered`,
              source: {
                type: ENTITY_TYPE.WIDGET,
                id: this.props.widgetId,
                name: this.props.widgetName,
              },
            });
        }
      });
    };

    handleTriggerEvalOnMetaUpdate = () => {
      const { triggerEvalOnMetaUpdate } = this.context;

      // if we have meta property update which needs to be send to evaluation only then trigger evaluation.
      // this will avoid triggering evaluation for the trailing end of debounce, when there are no meta updates.
      if (Object.keys(this.updatedProperties).length) {
        if (triggerEvalOnMetaUpdate) triggerEvalOnMetaUpdate();

        this.updatedProperties = {}; // once we trigger evaluation, we remove those property from updatedProperties
      }

      this.runBatchActions();
    };

    debouncedTriggerEvalOnMetaUpdate = debounce(
      this.handleTriggerEvalOnMetaUpdate,
      200,
      {
        leading: true,
        trailing: true,
      },
    );

    updateWidgetMetaProperty = (
      propertyName: string,
      propertyValue: unknown,
      actionExecution?: DebouncedExecuteActionPayload,
    ): void => {
      this.handleUpdateWidgetMetaProperty(
        propertyName,
        propertyValue,
        actionExecution,
      );
    };
    /**
     This function pushes meta updates that can be commited later.
     If there are multiple updates, use this function to batch those updates together.
     */
    pushBatchMetaUpdates: pushAction = (firstArgument, ...restArgs) => {
      //if first argument is an array its a batch lets push it
      if (Array.isArray(firstArgument)) {
        this.batchMetaUpdates.push(...firstArgument);

        return;
      }

      //if first argument is a string its a propertyName arg and we are pushing a single action
      if (typeof firstArgument === "string") {
        const [propertyValue, actionExecution] = restArgs;

        this.batchMetaUpdates.push({
          propertyName: firstArgument,
          propertyValue,
          actionExecution,
        });

        return;
      }

      const allArgs = [firstArgument, ...restArgs];

      error("unknown args ", allArgs);
    };
    /**
     This function commits all batched updates in one go.
     */
    commitBatchMetaUpdates = () => {
      //ignore commit if batch array is empty
      if (!this.batchMetaUpdates || !this.batchMetaUpdates.length) return;

      const metaUpdates = this.batchMetaUpdates.reduce(
        // TODO: Fix this the next time the file is edited
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (acc: any, { propertyName, propertyValue }) => {
          acc[propertyName] = propertyValue;

          return acc;
        },
        {},
      );

      AppsmithConsole.info({
        logType: LOG_TYPE.WIDGET_UPDATE,
        text: "Widget property was updated",
        source: {
          type: ENTITY_TYPE.WIDGET,
          id: this.props.widgetId,
          name: this.props.widgetName,
        },
        meta: metaUpdates,
      });
      // extract payload from updates
      const payload = [...this.batchMetaUpdates];

      //clear batch updates
      this.batchMetaUpdates = [];

      this.handleBatchUpdateWidgetMetaProperties(payload);
    };
    getMetaPropPath = (propertyName: string | undefined) => {
      // look at this.props.__metaOptions, check for metaPropPath value
      // if they exist, then update the propertyName
      // Below code of updating metaOptions can be removed once we have ListWidget v2 where we better manage meta values of ListWidget.
      const metaOptions = this.props.__metaOptions;

      if (!metaOptions) return;

      return `${metaOptions.metaPropPrefix}.${this.props.widgetName}.${propertyName}[${metaOptions.index}]`;
    };
    handleBatchUpdateWidgetMetaProperties = (
      batchMetaUpdates: batchUpdateWidgetMetaPropertyType,
    ) => {
      //if no updates ignore update call
      if (!batchMetaUpdates || isEmpty(batchMetaUpdates)) return;

      const { syncBatchUpdateWidgetMetaProperties } = this.context;

      const widgetId = this.props.metaWidgetId || this.props.widgetId;

      if (syncBatchUpdateWidgetMetaProperties) {
        const metaOptions = this.props.__metaOptions;
        const consolidatedUpdates = batchMetaUpdates.reduce(
          // TODO: Fix this the next time the file is edited
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (acc: any, { propertyName, propertyValue }) => {
            acc.push({ widgetId, propertyName, propertyValue });

            if (metaOptions) {
              acc.push({
                widgetId: metaOptions.widgetId,
                propertyName: this.getMetaPropPath(propertyName),
                propertyValue,
              });
            }

            return acc;
          },
          [],
        );

        syncBatchUpdateWidgetMetaProperties(consolidatedUpdates);
      }

      batchMetaUpdates.forEach(({ actionExecution, propertyName }) =>
        this.addPropertyForEval(propertyName, actionExecution),
      );

      this.setState({}, () => {
        // react batches the setState call
        // this will result in batching multiple updateWidgetMetaProperty calls.
        this.debouncedTriggerEvalOnMetaUpdate();
      });
    };

    handleUpdateWidgetMetaProperty = (
      propertyName: string,
      propertyValue: unknown,
      actionExecution?: DebouncedExecuteActionPayload,
    ) => {
      const { syncUpdateWidgetMetaProperty } = this.context;
      /**
       * Some meta widget will have the actual widget's widgetId as it's widgetId.
       * Eg - these are the widgets that are present in the first row of the List widget.
       * For these widgets, it's expected for the meta updates to not go into the actual widgetId
       * but a different internal id as over page changes the first row widgets should reflect distinct
       * values entered in that particular page.
       *
       * Note: metaWidgetId would be undefined for all the non meta-widgets.
       */
      const widgetId = this.props.metaWidgetId || this.props.widgetId;

      if (syncUpdateWidgetMetaProperty) {
        syncUpdateWidgetMetaProperty(widgetId, propertyName, propertyValue);

        // look at this.props.__metaOptions, check for metaPropPath value
        // if they exist, then update the propertyName
        // Below code of updating metaOptions can be removed once we have ListWidget v2 where we better manage meta values of ListWidget.
        const metaOptions = this.props.__metaOptions;
        const metaPropPath = this.getMetaPropPath(propertyName);

        if (metaOptions && metaPropPath) {
          syncUpdateWidgetMetaProperty(
            metaOptions.widgetId,
            metaPropPath,
            propertyValue,
          );
        }
      }

      this.addPropertyForEval(propertyName, actionExecution);
      this.setState({}, () => {
        // react batches the setState call
        // this will result in batching multiple updateWidgetMetaProperty calls.
        this.debouncedTriggerEvalOnMetaUpdate();
      });
    };

    updatedProps = () => {
      return {
        ...this.initialMetaState, // this contains stale default values and are used when widget is reset. Ideally, widget should reset to its default values instead of stale default values.
        ...this.props, // if default values are changed we expect to get new values from here.
        ...this.props.metaState,
      };
    };

    render() {
      return (
        <WrappedWidget
          {...this.updatedProps()}
          commitBatchMetaUpdates={this.commitBatchMetaUpdates}
          pushBatchMetaUpdates={this.pushBatchMetaUpdates}
          updateWidgetMetaProperty={this.updateWidgetMetaProperty}
        />
      );
    }
  }

  const mapStateToProps = (state: AppState, ownProps: WidgetProps) => {
    return {
      metaState: getWidgetMetaProps(state, ownProps),
    };
  };

  return connect(mapStateToProps)(MetaHOC);
}

export default withMeta;
