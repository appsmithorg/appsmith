import React from "react";
import BaseWidget, { WidgetProps } from "./BaseWidget";
import { debounce, fromPairs } from "lodash";
import { EditorContext } from "components/editorComponents/EditorContextProvider";
import AppsmithConsole from "utils/AppsmithConsole";
import { ENTITY_TYPE } from "entities/AppsmithConsole";
import LOG_TYPE from "entities/AppsmithConsole/logtype";
import { ExecuteTriggerPayload } from "constants/AppsmithActionConstants/ActionConstants";
import { connect } from "react-redux";
import { getWidgetMetaProps } from "sagas/selectors";
import { AppState } from "reducers";

export type DebouncedExecuteActionPayload = Omit<
  ExecuteTriggerPayload,
  "dynamicString"
> & {
  dynamicString?: string;
};

export interface WithMeta {
  updateWidgetMetaProperty: (
    propertyName: string,
    propertyValue: unknown,
    actionExecution?: DebouncedExecuteActionPayload,
  ) => void;
}

type WidgetMetaProps = { metaState: Record<string, unknown> };
type metaHOCProps = WidgetProps & WidgetMetaProps;

const withMeta = (WrappedWidget: typeof BaseWidget) => {
  class MetaHOC extends React.PureComponent<metaHOCProps> {
    static contextType = EditorContext;

    propertyTriggers = new Map<string, DebouncedExecuteActionPayload>();

    debouncedTriggerEvalOnMetaUpdate = debounce(
      this.props.triggerEvalOnMetaUpdate.bind(this),
      200,
      {
        leading: true,
        trailing: true,
      },
    );

    initialMetaState: Record<string, unknown>;

    constructor(props: WidgetProps) {
      super(props);
      const metaProperties = WrappedWidget.getMetaPropertiesMap();
      this.initialMetaState = fromPairs(
        Object.keys(metaProperties).map((metaProperty) => {
          return [metaProperty, this.props[metaProperty]];
        }),
      );
    }

    updateWidgetMetaProperty = (
      propertyName: string,
      propertyValue: unknown,
      actionExecution?: DebouncedExecuteActionPayload,
    ): void => {
      if (actionExecution) {
        this.propertyTriggers.set(propertyName, actionExecution);
      }

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
      this.handleUpdateWidgetMetaProperty(propertyName, propertyValue);
    };

    handleUpdateWidgetMetaProperty(
      propertyName: string,
      propertyValue: unknown,
    ) {
      const { executeAction, updateWidgetMetaProperty } = this.context;
      const { widgetId } = this.props;
      const metaOptions = this.props.__metaOptions;

      if (updateWidgetMetaProperty) {
        // step 6 - look at this.props.options, check for metaPropPath value
        // if they exist, then update the propertyName
        updateWidgetMetaProperty(widgetId, propertyName, propertyValue);

        if (metaOptions) {
          updateWidgetMetaProperty(
            metaOptions.widgetId,
            `${metaOptions.metaPropPrefix}.${this.props.widgetName}.${propertyName}[${metaOptions.index}]`,
            propertyValue,
          );
        }
      }
      const debouncedPayload = this.propertyTriggers.get(propertyName);
      if (debouncedPayload && debouncedPayload.dynamicString && executeAction) {
        executeAction({
          ...debouncedPayload,
          source: {
            id: this.props.widgetId,
            name: this.props.widgetName,
          },
        });
        this.propertyTriggers.delete(propertyName);
        debouncedPayload.triggerPropertyName &&
          AppsmithConsole.info({
            text: `${debouncedPayload.triggerPropertyName} triggered`,
            source: {
              type: ENTITY_TYPE.WIDGET,
              id: this.props.widgetId,
              name: this.props.widgetName,
            },
          });
      }
    }

    updatedProps = () => {
      return {
        ...this.props,
        ...this.initialMetaState,
        ...this.props.metaState,
      };
    };

    render() {
      return (
        <WrappedWidget
          {...this.updatedProps()}
          updateWidgetMetaProperty={this.updateWidgetMetaProperty}
        />
      );
    }
  }

  const mapStateToProps = (state: AppState, props: WidgetProps) => {
    const metaState = getWidgetMetaProps(state, props.widgetId) || {};
    return {
      metaState,
    };
  };

  return connect(mapStateToProps, null)(MetaHOC);
};

export default withMeta;
