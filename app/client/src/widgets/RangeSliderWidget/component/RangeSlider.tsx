import React, { useEffect, useRef, useState } from "react";
import throttle from "lodash/throttle";

import { LabelWithTooltip } from "design-system";
import { LabelPosition } from "components/constants";
import { Alignment } from "@blueprintjs/core";
import { TextSize } from "constants/WidgetConstants";
import { useMove } from "../../NumberSliderWidget/use-move";
import {
  getClientPosition,
  getPosition,
  getChangeValue,
  SliderSizes,
  getSliderStyles,
} from "../../NumberSliderWidget/utils";
import { Thumb } from "../../NumberSliderWidget/component/Thumb";
import { Track } from "../../NumberSliderWidget/component/Track";
import { SliderRoot } from "../../NumberSliderWidget/component/SilderRoot";
import { SliderContainer } from "widgets/NumberSliderWidget/component/Container";

type Value = [number, number];

export interface RangeSliderComponentProps
  extends Omit<
    React.ComponentPropsWithoutRef<"div">,
    "value" | "onChange" | "defaultValue" | "key"
  > {
  /** Color from theme.colors */
  color: string;

  /** Size of the Slider */
  sliderSize: SliderSizes;

  /** Minimal possible value */
  min: number;

  /** Maximum possible value */
  max: number;

  /** Minimal range interval */
  minRange: number;

  /** Number by which value will be incremented/decremented with thumb drag and arrows */
  step: number;

  /** Start value for the range slider */
  startValue: number;

  /** End value for the range slider */
  endValue: number;

  /** Called when user stops dragging slider or changes value with arrows */
  onChangeEnd?(value: Value): void;

  /** Hidden input name, use with uncontrolled variant */
  name: string;

  /** Show the marks label below the slider */
  showMarksLabel: boolean;

  /** Marks which will be placed on the track */
  marks?: { value: number; label: string }[];

  /** If true label will be not be hidden when user stops dragging */
  tooltipAlwaysOn: boolean;

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

  /** Loading property internal to every widget  */
  loading: boolean;
}

const RangeSliderComponent = (props: RangeSliderComponentProps) => {
  const {
    color,
    disabled = false,
    endValue = 100,
    labelAlignment,
    labelPosition,
    labelStyle,
    labelText,
    labelTextColor,
    labelTextSize,
    labelWidth,
    loading,
    marks,
    max = 100,
    min = 0,
    minRange = 10,
    name,
    onChangeEnd,
    showMarksLabel,
    sliderSize = "m",
    sliderTooltip,
    startValue = 0,
    step = 1,
    tooltipAlwaysOn = false,
    ...delegated
  } = props;

  const [focused, setFocused] = useState(-1);
  const [hovered, setHovered] = useState(false);

  const [_value, setValue] = useState<Value>([startValue, endValue]);

  const valueRef = useRef(_value);
  const thumbs = useRef<HTMLDivElement[]>([]);
  const thumbIndex = useRef<number>();
  const positions = [
    getPosition({ value: _value[0], min, max }),
    getPosition({ value: _value[1], min, max }),
  ];

  const _setValue = (val: Value) => {
    setValue(val);
    valueRef.current = val;
  };

  /**
   * If props.value change say we have a binding from
   * an Input widget set our internal state.
   */
  useEffect(() => {
    _setValue([startValue, endValue]);
  }, [startValue, endValue]);

  const setRangedValue = (
    val: number,
    index: number,
    triggerChangeEnd: boolean,
  ) => {
    const clone: Value = [...valueRef.current];
    clone[index] = val;

    if (index === 0) {
      if (val > clone[1] - minRange) {
        clone[1] = Math.min(val + minRange, max);
      }

      if (val > (max - minRange || min)) {
        clone[index] = valueRef.current[index];
      }
    }

    if (index === 1) {
      if (val < clone[0] + minRange) {
        clone[0] = Math.max(val - minRange, min);
      }

      if (val < clone[0] + minRange) {
        clone[index] = valueRef.current[index];
      }
    }

    _setValue(clone);

    if (triggerChangeEnd && !disabled) {
      onChangeEnd?.(valueRef.current);
    }
  };

  const handleChange = (val: number) => {
    if (!disabled) {
      const nextValue = getChangeValue({
        value: val,
        min,
        max,
        step,
      });
      setRangedValue(nextValue, thumbIndex.current || 0, false);
    }
  };

  const { active, ref: container } = useMove(({ x }) => handleChange(x), {
    onScrubEnd: () => onChangeEnd?.(valueRef.current),
  });

  function handleThumbMouseDown(
    event: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>,
    index: number,
  ) {
    if (event.cancelable) {
      event.preventDefault();
      event.stopPropagation();
    }

    thumbIndex.current = index;
  }

  const handleTrackMouseDownCapture = (
    event: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>,
  ) => {
    if (event.cancelable) {
      event.preventDefault();
    }

    container.current?.focus();
    const rect = container.current?.getBoundingClientRect() || {
      left: 0,
      width: 0,
    };
    const changePosition = getClientPosition(event.nativeEvent);
    const changeValue = getChangeValue({
      value: changePosition - rect.left,
      max,
      min,
      step,
      containerWidth: rect.width,
    });

    const nearestHandle =
      Math.abs(_value[0] - changeValue) > Math.abs(_value[1] - changeValue)
        ? 1
        : 0;
    thumbIndex.current = nearestHandle;
  };

  const getFocusedThumbIndex = () => {
    if (focused !== 1 && focused !== 0) {
      setFocused(0);
      return 0;
    }

    return focused;
  };

  const throttledSetRangedValue = throttle((val: number, index: number) => {
    setRangedValue(val, index, true);
  }, 800);

  const handleTrackKeydownCapture = (
    event: React.KeyboardEvent<HTMLDivElement>,
  ) => {
    if (!disabled) {
      switch (event.key) {
        case "ArrowUp":
        case "ArrowRight": {
          event.preventDefault();
          const focusedIndex = getFocusedThumbIndex();
          thumbs.current[focusedIndex].focus();
          throttledSetRangedValue(
            Math.min(Math.max(valueRef.current[focusedIndex] + step, min), max),
            focusedIndex,
          );
          break;
        }

        case "ArrowDown":
        case "ArrowLeft": {
          event.preventDefault();
          const focusedIndex = getFocusedThumbIndex();
          thumbs.current[focusedIndex].focus();
          throttledSetRangedValue(
            Math.min(Math.max(valueRef.current[focusedIndex] - step, min), max),
            focusedIndex,
          );
          break;
        }

        default: {
          break;
        }
      }
    }
  };

  const sharedThumbProps = {
    max,
    min,
    color,
    tooltipAlwaysOn,
    onBlur: () => setFocused(-1),
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
          loading={loading}
          position={labelPosition}
          text={labelText}
          width={labelWidth}
        />
      )}
      <SliderRoot
        {...delegated}
        disabled={disabled}
        labelPosition={labelPosition}
        onKeyDownCapture={handleTrackKeydownCapture}
        onMouseDownCapture={handleTrackMouseDownCapture}
        onMouseUpCapture={() => {
          thumbIndex.current = -1;
        }}
        onTouchEndCapture={() => {
          thumbIndex.current = -1;
        }}
        onTouchStartCapture={handleTrackMouseDownCapture}
        // @ts-expect-error: MutableRefObject not assignable to Ref
        ref={container}
        size={sliderSize}
      >
        <Track
          barBgColor={sliderBg.bar}
          color={color}
          disabled={disabled}
          filled={positions[1] - positions[0]}
          marks={marks}
          marksBg={sliderBg.marks}
          marksOffset={_value[0]}
          max={max}
          min={min}
          offset={positions[0]}
          onChange={(val) => {
            const nearestValue =
              Math.abs(_value[0] - val) > Math.abs(_value[1] - val) ? 1 : 0;
            const clone: Value = [..._value];
            clone[nearestValue] = val;
            _setValue(clone);
          }}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          showMarksLabel={showMarksLabel}
          size={sliderSize}
          trackBgColor={sliderBg.track}
          value={_value[1]}
        >
          <Thumb
            {...sharedThumbProps}
            disabled={disabled}
            dragging={active}
            onFocus={() => setFocused(0)}
            onMouseDown={(event) => handleThumbMouseDown(event, 0)}
            position={positions[0]}
            ref={(node) => {
              // @ts-expect-error: HTMLDivElement
              thumbs.current[0] = node;
            }}
            showTooltipOnHover={hovered}
            size={sliderSize}
            thumbBgColor={sliderBg.thumb}
            tooltipValue={sliderTooltip(_value[0])}
          />

          <Thumb
            {...sharedThumbProps}
            disabled={disabled}
            dragging={active}
            onFocus={() => setFocused(1)}
            onMouseDown={(event) => handleThumbMouseDown(event, 1)}
            position={positions[1]}
            ref={(node) => {
              // @ts-expect-error: HTMLDivElement
              thumbs.current[1] = node;
            }}
            showTooltipOnHover={hovered}
            size={sliderSize}
            thumbBgColor={sliderBg.thumb}
            tooltipValue={sliderTooltip(_value[1])}
          />
        </Track>

        <input name={`${name}_from`} type="hidden" value={_value[0]} />
        <input name={`${name}_to`} type="hidden" value={_value[1]} />
      </SliderRoot>
    </SliderContainer>
  );
};

export default RangeSliderComponent;
