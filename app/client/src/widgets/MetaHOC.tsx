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

    debouncedHandleUpdateWidgetMetaProperty = _.debounce(
      this.handleUpdateWidgetMetaProperty.bind(this),
      200,
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
      // TODO Handle debouncing different properties without loosing updates
      this.debouncedHandleUpdateWidgetMetaProperty(propertyName, propertyValue);
    };

    handleUpdateWidgetMetaProperty(propertyName: string, propertyValue: any) {
      const { updateWidgetMetaProperty } = this.context;
      const { widgetId, widgetName } = this.props;
      clearPropertyCache(`${widgetName}.${propertyName}`);
      updateWidgetMetaProperty &&
        updateWidgetMetaProperty(widgetId, propertyName, propertyValue);
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
