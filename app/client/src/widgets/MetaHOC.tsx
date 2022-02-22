import React from "react";
import BaseWidget, { WidgetProps } from "./BaseWidget";
import _ from "lodash";
import { EditorContext } from "components/editorComponents/EditorContextProvider";
import AppsmithConsole from "utils/AppsmithConsole";
import { ENTITY_TYPE } from "entities/AppsmithConsole";
import LOG_TYPE from "entities/AppsmithConsole/logtype";
import { ExecuteTriggerPayload } from "constants/AppsmithActionConstants/ActionConstants";

type DebouncedExecuteActionPayload = Omit<
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
  syncUpdateWidgetMetaProperty: (
    propertyName: string,
    propertyValue: unknown,
  ) => void;
}

type MetaHOCState = Record<string, unknown>;

const withMeta = (WrappedWidget: typeof BaseWidget) => {
  return class MetaHOC extends React.PureComponent<WidgetProps, MetaHOCState> {
    static contextType = EditorContext;
    updatedProperties = new Map<string, true>();
    propertyTriggers = new Map<string, DebouncedExecuteActionPayload>();

    debouncedHandleUpdateWidgetMetaProperty = _.debounce(
      this.handleUpdateWidgetMetaProperty.bind(this),
      200,
      {
        leading: true,
        trailing: true,
      },
    );

    constructor(props: WidgetProps) {
      super(props);
      const metaProperties = WrappedWidget.getMetaPropertiesMap();
      this.state = _.fromPairs(
        Object.keys(metaProperties).map((metaProperty) => {
          return [metaProperty, this.props[metaProperty]];
        }),
      );
    }

    componentDidUpdate(prevProps: WidgetProps) {
      const metaProperties = WrappedWidget.getMetaPropertiesMap();
      const defaultProperties = WrappedWidget.getDefaultPropertiesMap();
      Object.keys(metaProperties).forEach((metaProperty) => {
        const defaultProperty = defaultProperties[metaProperty];
        /*
          Generally the meta property value of a widget will directly be controlled by itself and the platform will not interfere except:
          When we reset the meta property value to it's default property value or initial value when property doesn't have default value.

          This operation happens by the platform and is outside the widget logic so to identify this change, we want to see if the meta value has
          changed. 
          
          If this has happened, we should set the state of the meta property value (controlled by inside the
          widget i.e., metaHOC state ) to the current value that is outside (controlled by platform i.e., dataTree )
        */
        const isMetaPropertyChanged = !_.isEqual(
          prevProps[metaProperty],
          this.props[metaProperty],
        );

        const defaultPropertyExist = !!defaultProperty;
        const isCurrentStateEqualToMeta = _.isEqual(
          this.props[metaProperty],
          this.state[metaProperty],
        );
        if (isMetaPropertyChanged && !isCurrentStateEqualToMeta) {
          if (defaultPropertyExist) {
            const isMetaEqualToDefault = _.isEqual(
              this.props[defaultProperty],
              this.props[metaProperty],
            );
            if (isMetaEqualToDefault) {
              this.setState({ [metaProperty]: this.props[metaProperty] });
            }
          }
        }
      });
    }

    updateWidgetMetaProperty = (
      propertyName: string,
      propertyValue: unknown,
      actionExecution?: DebouncedExecuteActionPayload,
    ): void => {
      this.updatedProperties.set(propertyName, true);
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
      this.setState(
        {
          [propertyName]: propertyValue,
        },
        () => {
          this.debouncedHandleUpdateWidgetMetaProperty();
        },
      );
    };

    // To be used when there is a race condition noticed on updating different
    // properties from a widget in quick succession
    syncUpdateWidgetMetaProperty = (
      propertyName: string,
      propertyValue: unknown,
    ): void => {
      const { updateWidgetMetaProperty } = this.context;
      const { widgetId } = this.props;
      this.setState({
        [propertyName]: propertyValue,
      });
      updateWidgetMetaProperty(widgetId, propertyName, propertyValue);
    };

    handleUpdateWidgetMetaProperty() {
      const { executeAction, updateWidgetMetaProperty } = this.context;
      const { widgetId } = this.props;
      const metaOptions = this.props.__metaOptions;
      /*
       We have kept a map of all updated properties. After debouncing we will
       go through these properties and update with the final value. This way
       we will only update a certain property once per debounce interval.
       Then we will execute any action associated with the trigger of
       that value changing
      */

      [...this.updatedProperties.keys()].forEach((propertyName) => {
        if (updateWidgetMetaProperty) {
          const propertyValue = this.state[propertyName];
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

          this.updatedProperties.delete(propertyName);
        }
        const debouncedPayload = this.propertyTriggers.get(propertyName);
        if (
          debouncedPayload &&
          debouncedPayload.dynamicString &&
          executeAction
        ) {
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
      });
    }

    updatedProps = () => {
      return {
        ...this.props,
        ...this.state,
        updateWidgetMetaProperty: this.updateWidgetMetaProperty,
        syncUpdateWidgetMetaProperty: this.syncUpdateWidgetMetaProperty,
      };
    };

    render() {
      return <WrappedWidget {...this.updatedProps()} />;
    }
  };
};

export default withMeta;
