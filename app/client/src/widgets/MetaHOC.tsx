import React from "react";
import BaseWidget, { WidgetProps } from "./BaseWidget";
import _ from "lodash";
import { EditorContext } from "../components/editorComponents/EditorContextProvider";
import { clearEvalPropertyCache } from "sagas/evaluationsSaga";
import { ExecuteActionPayload } from "../constants/ActionConstants";
import { ActionDescription } from "../entities/DataTree/dataTreeFactory";

type DebouncedExecuteActionPayload = Omit<ExecuteActionPayload, "triggers"> & {
  triggers?: ActionDescription<any>[];
};

export interface WithMeta {
  updateWidgetMetaProperty: (
    propertyName: string,
    propertyValue: any,
    actionExecution?: DebouncedExecuteActionPayload,
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
        Object.keys(metaProperties).map(metaProperty => {
          return [metaProperty, this.props[metaProperty]];
        }),
      );
    }

    componentDidUpdate(prevProps: WidgetProps) {
      const metaProperties = WrappedWidget.getMetaPropertiesMap();
      const defaultProperties = WrappedWidget.getDefaultPropertiesMap();
      Object.keys(metaProperties).forEach(metaProperty => {
        const defaultProperty = defaultProperties[metaProperty];
        if (
          prevProps[metaProperty] !== this.props[metaProperty] &&
          this.props[defaultProperty] === this.props[metaProperty]
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

    handleUpdateWidgetMetaProperty() {
      const { updateWidgetMetaProperty, executeAction } = this.context;
      const { widgetId, widgetName } = this.props;
      // We have kept a map of all updated properties. After debouncing we will
      // go through these properties and update with the final value. This way
      // we will only update a certain property once per debounce interval.
      // Then we will execute any action associated with the trigger of
      // that value changing
      [...this.updatedProperties.keys()].forEach(propertyName => {
        if (updateWidgetMetaProperty) {
          const propertyValue = this.state[propertyName];
          clearEvalPropertyCache(`${widgetName}.${propertyName}`);
          updateWidgetMetaProperty(widgetId, propertyName, propertyValue);
          this.updatedProperties.delete(propertyName);
        }
        const debouncedPayload = this.propertyTriggers.get(propertyName);
        if (
          debouncedPayload &&
          debouncedPayload.triggers?.length &&
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
      };
    };

    render() {
      return <WrappedWidget {...this.updatedProps()} />;
    }
  };
};

export default withMeta;
