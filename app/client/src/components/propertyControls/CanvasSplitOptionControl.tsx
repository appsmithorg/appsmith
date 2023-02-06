import { ReduxActionTypes } from "ce/constants/ReduxActionConstants";
import { ButtonGroup, TooltipComponent } from "design-system-old";
import * as React from "react";
import { useDispatch } from "react-redux";
import {
  DSEventDetail,
  DSEventTypes,
  DS_EVENT,
  emitInteractionAnalyticsEvent,
} from "utils/AppsmithUtils";
import {
  CanvasSplitOptions,
  CanvasSplitTypes,
  getCanvasSplitRatio,
} from "utils/autoLayout/canvasSplitProperties";
import BaseControl, { ControlData, ControlProps } from "./BaseControl";

/**
 * ----------------------------------------------------------------------------
 * TYPES
 *-----------------------------------------------------------------------------
 */
export interface CanvasSplitOptionsControlProps extends ControlProps {
  propertyValue: string | undefined;
}

const options = CanvasSplitOptions.map((optionKey, i) => ({
  icon: (
    <TooltipComponent
      content={
        <div>
          <div>{optionKey.label}</div>
        </div>
      }
      key={i}
      openOnTargetFocus={false}
    >
      <button tabIndex={-1}>{optionKey.icon}</button>
    </TooltipComponent>
  ),
  value: optionKey.value,
}));

const optionsValues = new Set(CanvasSplitOptions.map((each) => each.value));

export const CanvasSplitOptionsControlButtonTab = ({
  componentRef,
  evaluatedValue,
  widgetId,
}: any) => {
  const dispatch = useDispatch();
  return (
    <ButtonGroup
      options={options}
      ref={componentRef}
      selectButton={(value) => {
        dispatch({
          type: ReduxActionTypes.SPLIT_CANVAS,
          payload: {
            canvasSplitType: value as CanvasSplitTypes,
            parentId: widgetId,
            ratios: getCanvasSplitRatio(value as CanvasSplitTypes),
          },
        });
      }}
      values={evaluatedValue ? [evaluatedValue] : []}
    />
  );
};
// /**
//  * ----------------------------------------------------------------------------
//  * COMPONENT
//  *-----------------------------------------------------------------------------
//  */
class CanvasSplitOptionsControl extends BaseControl<
  CanvasSplitOptionsControlProps
> {
  componentRef = React.createRef<HTMLDivElement>();

  componentDidMount() {
    this.componentRef.current?.addEventListener(
      DS_EVENT,
      this.handleAdsEvent as (arg0: Event) => void,
    );
  }

  componentWillUnmount() {
    this.componentRef.current?.removeEventListener(
      DS_EVENT,
      this.handleAdsEvent as (arg0: Event) => void,
    );
  }

  handleAdsEvent = (e: CustomEvent<DSEventDetail>) => {
    if (
      e.detail.component === "ButtonTab" &&
      e.detail.event === DSEventTypes.KEYPRESS
    ) {
      emitInteractionAnalyticsEvent(this.componentRef.current, {
        key: e.detail.meta.key,
      });
      e.stopPropagation();
    }
  };

  static getControlType() {
    return "CANVAS_SPLIT_OPTIONS";
  }

  public render() {
    return (
      <CanvasSplitOptionsControlButtonTab
        componentRef={this.componentRef}
        evaluatedValue={this.props.propertyValue}
        widgetId={this.props.widgetProperties.widgetId}
      />
    );
  }

  static canDisplayValueInUI(config: ControlData, value: any): boolean {
    return optionsValues.has(value);
  }
}

export default CanvasSplitOptionsControl;
