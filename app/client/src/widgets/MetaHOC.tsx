import React from "react";
import BaseWidget, { WidgetProps } from "./BaseWidget";
import _ from "lodash";
import { EditorContext } from "../components/editorComponents/EditorContextProvider";
import { clearEvalPropertyCache } from "sagas/EvaluationsSaga";
import { ExecuteActionPayload } from "constants/AppsmithActionConstants/ActionConstants";

type DebouncedExecuteActionPayload = Omit<
  ExecuteActionPayload,
  "dynamicString"
> & {
  dynamicString?: string;
};

export interface WithMeta {
  updateWidgetMetaProperty: (
    propertyName: string,
    propertyValue: any,
    actionExecution?: DebouncedExecuteActionPayload,
  ) => void;
  syncUpdateWidgetMetaProperty: (
    propertyName: string,
    propertyValue: any,
  ) => void;
}

const withMeta = (WrappedWidget: typeof BaseWidget) => {
  return class MetaHOC extends React.Component<WidgetProps, any> {
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

    constructor(props: any) {
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
          Generally the meta property value of a widget will directly be
          controlled by itself and the platform will not interfere except:
          When we reset the meta property value to it's default property value.
          This operation happens by the platform and is outside the widget logic
          so to identify this change, we want to see if the meta value has
          changed to the current default value. If this has happened, we should
          set the state of the meta property value (controlled by inside the
          widget) to the current value that is outside (controlled by platform)
        */
        if (
          !_.isEqual(prevProps[metaProperty], this.props[metaProperty]) &&
          _.isEqual(this.props[defaultProperty], this.props[metaProperty])
        ) {
          this.setState({ [metaProperty]: this.props[metaProperty] });
        }
      });
    }

    updateWidgetMetaProperty = (
      propertyName: string,
      propertyValue: any,
      actionExecution?: DebouncedExecuteActionPayload,
    ): void => {
      this.updatedProperties.set(propertyName, true);
      if (actionExecution) {
        this.propertyTriggers.set(propertyName, actionExecution);
      }
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
      propertyValue: any,
    ): void => {
      const { updateWidgetMetaProperty } = this.context;
      const { widgetId, widgetName } = this.props;
      this.setState({
        [propertyName]: propertyValue,
      });
      clearEvalPropertyCache(`${widgetName}.${propertyName}`);
      updateWidgetMetaProperty(widgetId, propertyName, propertyValue);
    };

    handleUpdateWidgetMetaProperty() {
      const { updateWidgetMetaProperty, executeAction } = this.context;
      const { widgetId, widgetName } = this.props;
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
          clearEvalPropertyCache(`${widgetName}.${propertyName}`);
          updateWidgetMetaProperty(widgetId, propertyName, propertyValue);
          this.updatedProperties.delete(propertyName);
        }
        const debouncedPayload = this.propertyTriggers.get(propertyName);
        if (
          debouncedPayload &&
          debouncedPayload.dynamicString &&
          executeAction
        ) {
          executeAction(debouncedPayload);
          this.propertyTriggers.delete(propertyName);
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
