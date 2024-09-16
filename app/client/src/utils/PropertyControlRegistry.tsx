import React from "react";
import PropertyControlFactory from "./PropertyControlFactory";
import type { PropertyControlPropsType } from "components/propertyControls";
import { PropertyControls } from "components/propertyControls";
import type { ControlProps } from "components/propertyControls/BaseControl";
import type BaseControl from "components/propertyControls/BaseControl";
import type { InteractionAnalyticsEventDetail } from "./AppsmithUtils";
import {
  interactionAnalyticsEvent,
  INTERACTION_ANALYTICS_EVENT,
} from "./AppsmithUtils";

function withAnalytics(WrappedControl: typeof BaseControl) {
  return class AnalyticsHOC extends React.PureComponent<ControlProps> {
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    containerRef = React.createRef<any>();

    constructor(props: ControlProps) {
      super(props);
    }

    componentDidMount() {
      this.containerRef.current?.addEventListener(
        INTERACTION_ANALYTICS_EVENT,
        this.handleKbdEvent,
      );
    }

    componentWillUnmount() {
      this.containerRef.current?.removeEventListener(
        INTERACTION_ANALYTICS_EVENT,
        this.handleKbdEvent,
      );
    }

    handleKbdEvent = (e: Event) => {
      const event = e as CustomEvent<InteractionAnalyticsEventDetail>;
      if (!event.detail?.propertyName) {
        e.stopPropagation();
        this.containerRef.current?.dispatchEvent(
          interactionAnalyticsEvent({
            key: event.detail.key,
            propertyType: AnalyticsHOC.getControlType(),
            propertyName: this.props.propertyName,
            widgetType: this.props.widgetProperties.type,
          }),
        );
      }
    };

    static getControlType() {
      return WrappedControl.getControlType();
    }

    render() {
      return (
        <div ref={this.containerRef}>
          <WrappedControl {...this.props} />
        </div>
      );
    }
  };
}

class PropertyControlRegistry {
  static registerPropertyControlBuilders() {
    Object.values(PropertyControls).forEach(
      (Control: typeof BaseControl & { getControlType: () => string }) => {
        const ControlWithAnalytics = withAnalytics(Control);
        const controlType = ControlWithAnalytics.getControlType();
        PropertyControlFactory.registerControlBuilder(
          controlType,
          {
            buildPropertyControl(
              controlProps: PropertyControlPropsType,
            ): JSX.Element {
              return <ControlWithAnalytics {...controlProps} />;
            },
          },
          {
            canDisplayValueInUI: Control.canDisplayValueInUI,
            shouldValidateValueOnDynamicPropertyOff:
              Control.shouldValidateValueOnDynamicPropertyOff,
          },
          Control.getInputComputedValue,
        );
      },
    );
  }
}

export default PropertyControlRegistry;
