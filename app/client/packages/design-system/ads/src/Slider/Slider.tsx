import React from "react";
import { useSlider, useSliderThumb } from "@react-aria/slider";
import { useSliderState } from "@react-stately/slider";
import { FocusRing } from "@react-aria/focus";
import { VisuallyHidden } from "@react-aria/visually-hidden";
import { useNumberFormatter } from "@react-aria/i18n";
import type { AriaSliderProps } from "@react-types/slider";
import { Text } from "../Text";
// Removed FlexWrapper import as we're using LabelWrapper from Slider.styles.tsx
import { ToggleComponentToJsonHandler } from "../../../../../../../src/components/editorComponents/form/ToggleComponentToJson";
import { SliderFocusVisibleClassName } from "./Slider.constants";
import {
  StyledSlider,
  SliderLabel,
  Thumb,
  Rail,
  FilledRail,
  Track,
  TrackContainer,
  LabelWrapper,
} from "./Slider.styles";
import type { SliderProps } from "./Slider.types";

export function Slider(props: SliderProps) {
  const trackRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const origin = props.origin ?? props.minValue ?? 0;

  const multiProps: AriaSliderProps<number[]> = {
    ...props,
    value: props.value == null ? undefined : [props.value],
    defaultValue: props.defaultValue == null ? undefined : [props.defaultValue],
    onChange:
      props.onChange == null
        ? undefined
        : (vals: number[]) => props.onChange?.(vals[0]),
    onChangeEnd:
      props.onChangeEnd == null
        ? undefined
        : (vals: number[]) => props.onChangeEnd?.(vals[0]),
  };
  const formatter = useNumberFormatter(props.formatOptions);
  const state = useSliderState({ ...multiProps, numberFormatter: formatter });
  const { groupProps, labelProps, outputProps, trackProps } = useSlider(
    multiProps,
    state,
    trackRef,
  );

  const { inputProps, thumbProps } = useSliderThumb(
    {
      index: 0,
      isDisabled: props.isDisabled,
      trackRef,
      inputRef,
    },
    state,
  );

  const value = state.values[0];
  const getDisplayValue = () => {
    if (typeof props.getValueLabel === "function") {
      return props.getValueLabel(state.getThumbValue(0));
    }

    return state.getThumbValueLabel(0);
  };

  return (
    <StyledSlider {...groupProps} disabled={props.isDisabled}>
      <SliderLabel>
        {props.label && (
          <LabelWrapper>
            {/* @ts-expect-error incompatible types for Text and labelProps */}
            <Text renderAs="label" {...labelProps}>
              {props.label}
            </Text>
            {props.configProperty && props.formName && (
              <ToggleComponentToJsonHandler
                configProperty={props.configProperty}
                formName={props.formName}
              />
            )}
          </LabelWrapper>
        )}
        {/*@ts-expect-error incompatible types for Text and outputProps**/}
        <Text {...outputProps}>{getDisplayValue()}</Text>
      </SliderLabel>
      <TrackContainer>
        <Rail />
        <FilledRail
          style={{
            left: `${state.getValuePercent(Math.min(value, origin)) * 100}%`,
            width: `${(state.getValuePercent(Math.max(value, origin)) - state.getValuePercent(Math.min(value, origin))) * 100}%`,
          }}
        />
        <Track ref={trackRef} {...trackProps} />
        <FocusRing focusRingClass={SliderFocusVisibleClassName} within>
          <Thumb
            style={{
              left: `${state.getThumbPercent(0) * 100}%`,
            }}
            {...thumbProps}
          >
            <VisuallyHidden>
              <input ref={inputRef} {...inputProps} />
            </VisuallyHidden>
          </Thumb>
        </FocusRing>
      </TrackContainer>
    </StyledSlider>
  );
}
