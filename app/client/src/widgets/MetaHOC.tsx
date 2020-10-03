import React from "react";
import BaseWidget, { WidgetProps } from "./BaseWidget";
import _ from "lodash";
import { EditorContext } from "../components/editorComponents/EditorContextProvider";
import { clearPropertyCache } from "../utils/DynamicBindingUtils";

export type WithMeta = {
  updateWidgetMetaProperty: (propertyName: string, propertyValue: any) => void;
};

const withMeta = (WrappedWidget: typeof BaseWidget) => {
  return class MetaHOC extends React.Component<WidgetProps, any> {
    static contextType = EditorContext;
    updatedProperties = new Map<string, true>();

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
    ): void => {
      this.setState({
        [propertyName]: propertyValue,
      });
      this.updatedProperties.set(propertyName, true);
      this.debouncedHandleUpdateWidgetMetaProperty();
    };

    handleUpdateWidgetMetaProperty() {
      const { updateWidgetMetaProperty } = this.context;
      const { widgetId, widgetName } = this.props;
      // We have kept a map of all updated properties. After debouncing we will
      // go through these properties and update with the final value. This way
      // we will only update a certain property once per debounce interval.
      [...this.updatedProperties.keys()].forEach(propertyName => {
        if (updateWidgetMetaProperty) {
          const propertyValue = this.state[propertyName];
          clearPropertyCache(`${widgetName}.${propertyName}`);
          updateWidgetMetaProperty(widgetId, propertyName, propertyValue);
          this.updatedProperties.delete(propertyName);
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
