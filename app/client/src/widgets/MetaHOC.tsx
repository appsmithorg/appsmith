import React from "react";
import BaseWidget, { WidgetProps } from "./BaseWidget";
import { debounce } from "lodash";
import { EditorContext } from "components/editorComponents/EditorContextProvider";
import AppsmithConsole from "utils/AppsmithConsole";
import { ENTITY_TYPE } from "entities/AppsmithConsole";
import LOG_TYPE from "entities/AppsmithConsole/logtype";
import { ExecuteTriggerPayload } from "constants/AppsmithActionConstants/ActionConstants";
import { connect } from "react-redux";
import { getWidgetMetaProps } from "sagas/selectors";
import { AppState } from "reducers";
import { triggerEvalOnMetaUpdate } from "actions/metaActions";

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

    initialMetaState: Record<string, unknown>;

    constructor(props: metaHOCProps) {
      super(props);
      this.initialMetaState = { ...WrappedWidget.getMetaPropertiesMap() };
    }

    handleTriggerEvalOnMetaUpdate = (
      actionExecution?: DebouncedExecuteActionPayload,
    ) => {
      const { executeAction } = this.context;
      if (actionExecution && actionExecution.dynamicString && executeAction) {
        executeAction({
          ...actionExecution,
          source: {
            id: this.props.widgetId,
            name: this.props.widgetName,
          },
        });
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
      this.props.triggerEvalOnMetaUpdate();
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
      this.handleUpdateWidgetMetaProperty(
        propertyName,
        propertyValue,
        actionExecution,
      );
    };

    handleUpdateWidgetMetaProperty = (
      propertyName: string,
      propertyValue: unknown,
      actionExecution?: DebouncedExecuteActionPayload,
    ) => {
      const { syncUpdateWidgetMetaProperty } = this.context;
      const { widgetId } = this.props;

      if (syncUpdateWidgetMetaProperty) {
        syncUpdateWidgetMetaProperty(widgetId, propertyName, propertyValue);

        // look at this.props.__metaOptions, check for metaPropPath value
        // if they exist, then update the propertyName
        // Below code of updating metaOptions can be removed once we have ListWidget v2 where we better manage meta values of ListWidget.
        const metaOptions = this.props.__metaOptions;
        if (metaOptions) {
          syncUpdateWidgetMetaProperty(
            metaOptions.widgetId,
            `${metaOptions.metaPropPrefix}.${this.props.widgetName}.${propertyName}[${metaOptions.index}]`,
            propertyValue,
          );
        }
      }
      this.debouncedTriggerEvalOnMetaUpdate(actionExecution);
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
