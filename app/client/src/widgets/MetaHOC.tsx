import React from "react";
import { debounce } from "lodash";
import BaseWidget, {
  WidgetProps,
  DebouncedExecuteActionPayload,
} from "./BaseWidget";
import { EditorContext } from "components/editorComponents/EditorContextProvider";
import AppsmithConsole from "utils/AppsmithConsole";
import { ENTITY_TYPE } from "entities/AppsmithConsole";
import LOG_TYPE from "entities/AppsmithConsole/logtype";
import { connect } from "react-redux";
import { getWidgetMetaProps } from "sagas/selectors";
import { AppState } from "reducers";
import { triggerEvalOnMetaUpdate } from "actions/metaActions";
import { WidgetMetaUpdates } from "actions/metaActions";
import { ExecuteTriggerPayload } from "constants/AppsmithActionConstants/ActionConstants";
import { MetaUpdates } from "./BaseWidget";

export interface WithMeta {
  updateWidgetMetaProperty: (
    propertyName: string,
    propertyValue: unknown,
    actionExecution?: DebouncedExecuteActionPayload,
  ) => void;
  updateWidgetMetaProperties: (widgetMetaUpdates: WidgetMetaUpdates) => void;
}

type WidgetMetaProps = { metaState: Record<string, unknown> };
type metaHOCProps = WidgetProps & WidgetMetaProps;

function withMeta(WrappedWidget: typeof BaseWidget) {
  class MetaHOC extends React.PureComponent<metaHOCProps> {
    static contextType = EditorContext;
    context!: React.ContextType<typeof EditorContext>;

    initialMetaState: Record<string, unknown>;

    constructor(props: metaHOCProps) {
      super(props);
      this.initialMetaState = { ...WrappedWidget.getMetaPropertiesMap() };
    }

    debouncedTriggerEvalOnMetaUpdate = debounce(
      this.props.triggerEvalOnMetaUpdate,
      200,
      {
        leading: true,
        trailing: true,
      },
    );

    logUpdateMeta = (propertyName: string, propertyValue: unknown) => {
      AppsmithConsole.info({
        logType: LOG_TYPE.WIDGET_UPDATE,
        text: "Widget property was updated",
        source: {
          type: ENTITY_TYPE.WIDGET,
          id: this.props.widgetId,
          name: this.props.widgetName,
          propertyPath: propertyName,
        },
        state: {
          [propertyName]: propertyValue,
        },
      });
    };

    logExecuteTrigger = (actionExecution: ExecuteTriggerPayload) => {
      if (actionExecution.triggerPropertyName)
        AppsmithConsole.info({
          text: `${actionExecution.triggerPropertyName} triggered`,
          source: {
            type: ENTITY_TYPE.WIDGET,
            id: this.props.widgetId,
            name: this.props.widgetName,
          },
        });
    };

    updateWidgetMetaProperties = (metaUpdates: MetaUpdates): void => {
      this.handleUpdateWidgetMetaProperties(metaUpdates);
    };

    updateWidgetMetaProperty = (
      propertyName: string,
      propertyValue: unknown,
      actionExecution?: ExecuteTriggerPayload,
    ): void => {
      this.handleUpdateWidgetMetaProperties([
        {
          propertyName,
          propertyValue,
          actionExecution,
        },
      ]);
      this.debouncedTriggerEvalOnMetaUpdate();
    };

    handleUpdateWidgetMetaProperties = (
      widgetMetaUpdates: {
        propertyName: string;
        propertyValue: unknown;
        actionExecution?: ExecuteTriggerPayload;
      }[],
    ) => {
      const { executeAction, updateWidgetMetaProperties } = this.context;
      const { widgetId } = this.props;
      const allWidgetMetaUpdates: WidgetMetaUpdates = widgetMetaUpdates.map(
        ({ propertyName, propertyValue }) => {
          this.logUpdateMeta(propertyName, propertyValue);
          return {
            widgetId,
            propertyName,
            propertyValue,
          };
        },
      );
      // look at this.props.__metaOptions, check for metaPropPath value
      // if they exist, then update the propertyName
      // Below code of updating metaOptions can be removed once we have ListWidget v2 where we better manage meta values of ListWidget.
      const metaOptions = this.props.__metaOptions;
      if (metaOptions) {
        widgetMetaUpdates.forEach(({ propertyName, propertyValue }) => {
          allWidgetMetaUpdates.push({
            widgetId: metaOptions.widgetId,
            propertyName: `${metaOptions.metaPropPrefix}.${this.props.widgetName}.${propertyName}[${metaOptions.index}]`,
            propertyValue,
          });
        });
      }

      if (updateWidgetMetaProperties) {
        updateWidgetMetaProperties(allWidgetMetaUpdates);
      }
      // TODO: batch trigger actions if possible
      widgetMetaUpdates.forEach(({ actionExecution }) => {
        if (actionExecution && actionExecution.dynamicString && executeAction) {
          executeAction({
            ...actionExecution,
            source: {
              id: this.props.widgetId,
              name: this.props.widgetName,
            },
          });
          this.logExecuteTrigger(actionExecution);
        }
      });
    };

    updatedProps = () => {
      return {
        ...this.initialMetaState,
        ...this.props,
        ...this.props.metaState,
      };
    };

    render() {
      return (
        <WrappedWidget
          {...this.updatedProps()}
          updateWidgetMetaProperties={this.updateWidgetMetaProperties}
          updateWidgetMetaProperty={this.updateWidgetMetaProperty}
        />
      );
    }
  }

  const mapStateToProps = (state: AppState, ownProps: WidgetProps) => {
    const metaState = getWidgetMetaProps(state, ownProps.widgetId) || {};
    return {
      metaState,
    };
  };

  const mapDispatchToProps = (dispatch: any) => ({
    triggerEvalOnMetaUpdate: () => {
      dispatch(triggerEvalOnMetaUpdate());
    },
  });

  return connect(mapStateToProps, mapDispatchToProps)(MetaHOC);
}

export default withMeta;
