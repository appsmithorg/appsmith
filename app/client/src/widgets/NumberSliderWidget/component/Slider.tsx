import React, { useRef, useState, useCallback, useEffect } from "react";

import { LabelWithTooltip } from "design-system";
import { LabelPosition } from "components/constants";
import { Alignment } from "@blueprintjs/core";
import { TextSize } from "constants/WidgetConstants";
import {
  getChangeValue,
  getPosition,
  getSliderStyles,
  SliderSizes,
} from "../utils";
import { useMove } from "../use-move";
import { SliderContainer } from "./Container";
import { SliderRoot } from "./SilderRoot";
import { Track } from "./Track";
import { Thumb } from "./Thumb";

export interface SliderComponentProps
  extends Omit<
    React.ComponentPropsWithoutRef<"div">,
    "value" | "onChange" | "key"
  > {
  /** Color from theme.colors */
  color: string;

  /** Size of the Slider */
  sliderSize: SliderSizes;

  /** Minimal possible value */
  min: number;

  /** Maximum possible value */
  max: number;

  /** Number by which value will be incremented/decremented with thumb drag and arrows */
  step: number;

  /** Current value for controlled slider */
  sliderValue: number;

  /** Called when user stops dragging slider or changes value with arrows */
  onChangeEnd(value: number): void;

  /** Hidden input name, use with uncontrolled variant */
  name: string;

  /** Marks which will be placed on the track */
  marks?: { value: number; label: string }[];

  /** If true label will be not be hidden when user stops dragging */
  tooltipAlwaysOn: boolean;

  /** helpText for the label tooltip */
  labelTooltip?: string;

  /** Disables slider */
  disabled?: boolean;

  /** Display label on the Slider */
  sliderTooltip: (value: number) => string;

  /** Label text  */
  labelText: string;

  /** Position of the Label Top, Left, Auto */
  labelPosition?: LabelPosition;

  /** Alignment of the Label Left, Right */
  labelAlignment?: Alignment;

  /** Width of the Label, used only when Position is Left   */
  labelWidth?: number;

  /** Color for the Label text  */
  labelTextColor?: string;

  /** Font Size for the Label text  */
  labelTextSize?: TextSize;

  /** Font Style for the Label text  */
  labelStyle?: string;

  /** Loading property internal to every widget */
  loading: boolean;

  /** determines whether to display mark labels or only marks */
  showMarksLabel: boolean;
}

const SliderComponent = (props: SliderComponentProps) => {
  const {
    color,
    disabled = false,
    labelAlignment,
    labelPosition,
    labelStyle,
    labelText,
    labelTextColor,
    labelTextSize,
    labelTooltip,
    labelWidth,
    loading,
    marks,
    max = 100,
    min = 0,
    name,
    onChangeEnd,
    showMarksLabel,
    sliderSize = "m",
    sliderTooltip,
    sliderValue = 0,
    step = 1,
    tooltipAlwaysOn,
  } = props;

  const [_value, setValue] = useState(sliderValue);
  const [hovered, setHovered] = useState(false);
  const valueRef = useRef(_value);
  const thumb = useRef<HTMLDivElement>();

  const position = getPosition({ value: _value, min, max });

  /**
   * If props.value change say we have a binding from
   * an Input widget set our internal state.
   */
  useEffect(() => {
    setValue(sliderValue);
  }, [sliderValue]);

  const handleChange = useCallback(
    ({ x }: { x: number }) => {
      if (!disabled) {
        const nextValue = getChangeValue({
          value: x,
          min,
          max,
          step,
        });
        setValue(nextValue);
        valueRef.current = nextValue;
      }
    },
    [disabled, min, max, step],
  );

  const { active, ref: container } = useMove(handleChange, {
    onScrubEnd: () => {
      if (!disabled) {
        onChangeEnd(valueRef.current);
      }
    },
  });

  const handleThumbMouseDown = (
    event: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>,
  ) => {
    if (event.cancelable) {
      event.preventDefault();
      event.stopPropagation();
    }
  };

  const handleTrackKeydownCapture = (
    event: React.KeyboardEvent<HTMLDivElement>,
  ) => {
    if (!disabled) {
      switch (event.key) {
        case "ArrowUp":
        case "ArrowRight": {
          event.preventDefault();
          thumb.current?.focus();
          const nextValue = Math.min(Math.max(_value + step, min), max);
          onChangeEnd(nextValue);
          setValue(nextValue);
          break;
        }

        case "ArrowDown":
        case "ArrowLeft": {
          event.preventDefault();
          thumb.current?.focus();
          const nextValue = Math.min(Math.max(_value - step, min), max);
          onChangeEnd(nextValue);
          setValue(nextValue);
          break;
        }

        default: {
          break;
        }
      }
    }
  };

  const sliderBg = getSliderStyles({
    color,
    disabled,
    dragging: active,
    hovering: hovered,
  });

  return (
    <SliderContainer compactMode labelPosition={labelPosition}>
      {labelText && (
        <LabelWithTooltip
          alignment={labelAlignment}
          color={labelTextColor}
          compact
          disabled={disabled}
          fontSize={labelTextSize}
          fontStyle={labelStyle}
          helpText={labelTooltip}
          loading={loading}
          position={labelPosition}
          text={labelText}
          width={labelWidth}
        />
      )}
      <SliderRoot
        disabled={disabled}
        labelPosition={labelPosition}
        onKeyDownCapture={handleTrackKeydownCapture}
        onMouseDownCapture={() => container.current?.focus()}
        // @ts-expect-error: MutableRefObject not assignable to Ref
        ref={container}
        size={sliderSize}
      >
        <Track
          barBgColor={sliderBg.bar}
          color={color}
          disabled={disabled}
          filled={position}
          marks={marks}
          marksBg={sliderBg.marks}
          max={max}
          min={min}
          offset={0}
          onChange={setValue}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          showMarksLabel={showMarksLabel}
          size={sliderSize}
          trackBgColor={sliderBg.track}
          value={_value}
        >
          <Thumb
            color={color}
            disabled={disabled}
            dragging={active}
            max={max}
            min={min}
            onMouseDown={handleThumbMouseDown}
            position={position}
            // @ts-expect-error: MutableRefObject not assignable to Ref
            ref={thumb}
            showTooltipOnHover={hovered}
            size={sliderSize}
            thumbBgColor={sliderBg.thumb}
            tooltipAlwaysOn={tooltipAlwaysOn}
            tooltipValue={sliderTooltip(_value)}
          />
        </Track>

        <input name={name} type="hidden" value={_value} />
      </SliderRoot>
    </SliderContainer>
  );
};

export default SliderComponent;
