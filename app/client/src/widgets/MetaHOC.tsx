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

function withMeta(WrappedWidget: typeof BaseWidget) {
  class MetaHOC extends React.PureComponent<metaHOCProps> {
    static contextType = EditorContext;

    propertyTriggers = new Map<string, DebouncedExecuteActionPayload>();

    initialMetaState: Record<string, unknown>;

    constructor(props: metaHOCProps) {
      super(props);

      const metaProperties = WrappedWidget.getMetaPropertiesMap();
      this.initialMetaState = fromPairs(
        Object.keys(metaProperties).map((metaProperty) => {
          return [metaProperty, this.props[metaProperty]];
        }),
      );
    }

    debouncedTriggerEvalOnMetaUpdate = () => {
      const { triggerEvalOnMetaUpdate } = this.context;

      if (triggerEvalOnMetaUpdate) {
        return debounce(triggerEvalOnMetaUpdate, 200, {
          leading: true,
          trailing: true,
        });
      }
    };

    handleUpdateWidgetMetaProperty = (
      propertyName: string,
      propertyValue: unknown,
    ) => {
      const { executeAction, updateWidgetMetaProperty } = this.context;
      const { widgetId } = this.props;

      if (updateWidgetMetaProperty) {
        updateWidgetMetaProperty(widgetId, propertyName, propertyValue);

        // look at this.props.__metaOptions, check for metaPropPath value
        // if they exist, then update the propertyName
        // Below code of updating metaOptions can be removed once we have ListWidget v2 where we better manage meta values of ListWidget.
        const metaOptions = this.props.__metaOptions;
        if (metaOptions) {
          updateWidgetMetaProperty(
            metaOptions.widgetId,
            `${metaOptions.metaPropPrefix}.${this.props.widgetName}.${propertyName}[${metaOptions.index}]`,
            propertyValue,
          );
        }
      }
      const payload = this.propertyTriggers.get(propertyName);
      if (payload && payload.dynamicString && executeAction) {
        executeAction({
          ...payload,
          source: {
            id: this.props.widgetId,
            name: this.props.widgetName,
          },
        });
        this.propertyTriggers.delete(propertyName);
        payload.triggerPropertyName &&
          AppsmithConsole.info({
            text: `${payload.triggerPropertyName} triggered`,
            source: {
              type: ENTITY_TYPE.WIDGET,
              id: this.props.widgetId,
              name: this.props.widgetName,
            },
          });
      }
    };

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
      this.debouncedTriggerEvalOnMetaUpdate();
    };

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

  function mapStateToProps(state: AppState, ownProps: WidgetProps) {
    const metaState = getWidgetMetaProps(state, ownProps.widgetId) || {};
    return {
      metaState,
    };
  }

  return connect(mapStateToProps)(MetaHOC);
}

export default withMeta;
