import { ReduxActionTypes } from "ce/constants/ReduxActionConstants";
import { ButtonTab, TooltipComponent } from "design-system";
import * as React from "react";
import { useDispatch } from "react-redux";
import {
  DSEventDetail,
  DSEventTypes,
  DS_EVENT,
  emitInteractionAnalyticsEvent,
} from "utils/AppsmithUtils";
import { ColumnSplitOptions } from "utils/layoutPropertiesUtils";
import BaseControl, { ControlData, ControlProps } from "./BaseControl";

/**
 * ----------------------------------------------------------------------------
 * TYPES
 *-----------------------------------------------------------------------------
 */
export interface ColumnSplitOptionsControlProps extends ControlProps {
  propertyValue: string | undefined;
}

const options = ColumnSplitOptions.map((optionKey, i) => ({
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
      <button tabIndex={-1}>{i}</button>
    </TooltipComponent>
  ),
  value: optionKey.value,
}));

const optionsValues = new Set(ColumnSplitOptions.map((each) => each.value));

export const ColumnSplitOptionsControlButtonTab = ({
  componentRef,
  evaluatedValue,
  widgetId,
}: any) => {
  const dispatch = useDispatch();
  return (
    <ButtonTab
      options={options}
      ref={componentRef}
      selectButton={(value) => {
        dispatch({
          type: ReduxActionTypes.UPDATE_COLUMN_SPLIT_PROPERTY,
          payload: {
            updatedValue: value,
            widgetId,
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
class ColumnSplitOptionsControl extends BaseControl<
  ColumnSplitOptionsControlProps
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
    return "COLUMN_SPLIT_OPTIONS";
  }

  public render() {
    return (
      <ColumnSplitOptionsControlButtonTab
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

export default ColumnSplitOptionsControl;
