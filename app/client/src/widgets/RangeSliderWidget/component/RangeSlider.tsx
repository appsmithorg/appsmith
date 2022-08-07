import React, { useEffect, useRef, useState } from "react";
import throttle from "lodash/throttle";

import { useMove } from "../../SingleSliderWidget/use-move";
import {
  getClientPosition,
  getPosition,
  getChangeValue,
  SliderSizes,
} from "../../SingleSliderWidget/utils";
import { Thumb } from "../../SingleSliderWidget/component/Thumb";
import { Track } from "../../SingleSliderWidget/component/Track";
import { SliderRoot } from "../../SingleSliderWidget/component/SilderRoot";

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

  /** Amount of digits after the decimal point */
  precision?: number;

  /** Start value for the range slider */
  startValue: number;

  /** End value for the range slider */
  endValue: number;

  /** Called when user stops dragging slider or changes value with arrows */
  onChangeEnd?(value: Value): void;

  /** Hidden input name, use with uncontrolled variant */
  name: string;

  /** Marks which will be placed on the track */
  marks?: { value: number; label: string }[];

  /** If true label will be not be hidden when user stops dragging */
  labelAlwaysOn?: boolean;

  /**If true slider label will appear on hover */
  showLabelOnHover?: boolean;

  /** Disables slider */
  disabled?: boolean;
}

const RangeSliderComponent = (props: RangeSliderComponentProps) => {
  const {
    color,
    disabled = false,
    endValue,
    labelAlwaysOn = false,
    marks,
    max,
    min,
    minRange,
    name,
    onChangeEnd,
    precision,
    showLabelOnHover = true,
    sliderSize,
    startValue,
    step,
    ...others
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

    if (triggerChangeEnd) {
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
        precision,
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
        case "ArrowUp": {
          event.preventDefault();
          const focusedIndex = getFocusedThumbIndex();
          thumbs.current[focusedIndex].focus();
          throttledSetRangedValue(
            Math.min(Math.max(valueRef.current[focusedIndex] + step, min), max),
            focusedIndex,
          );
          break;
        }
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

        case "ArrowDown": {
          event.preventDefault();
          const focusedIndex = getFocusedThumbIndex();
          thumbs.current[focusedIndex].focus();
          throttledSetRangedValue(
            Math.min(Math.max(valueRef.current[focusedIndex] - step, min), max),
            focusedIndex,
          );
          break;
        }
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
    labelAlwaysOn,
    onBlur: () => setFocused(-1),
  };

  return (
    <SliderRoot
      {...others}
      disabled={disabled}
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
        color={color}
        disabled={disabled}
        filled={positions[1] - positions[0]}
        marks={marks}
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
        onMouseEnter={showLabelOnHover ? () => setHovered(true) : undefined}
        onMouseLeave={showLabelOnHover ? () => setHovered(false) : undefined}
        size={sliderSize}
        value={_value[1]}
      >
        <Thumb
          {...sharedThumbProps}
          disabled={disabled}
          dragging={active}
          label={_value[0].toString()}
          onFocus={() => setFocused(0)}
          onMouseDown={(event) => handleThumbMouseDown(event, 0)}
          position={positions[0]}
          ref={(node) => {
            // @ts-expect-error: HTMLDivElement
            thumbs.current[0] = node;
          }}
          showLabelOnHover={showLabelOnHover && hovered}
          size={sliderSize}
          value={_value[0]}
        />

        <Thumb
          {...sharedThumbProps}
          disabled={disabled}
          dragging={active}
          label={_value[1].toString()}
          onFocus={() => setFocused(1)}
          onMouseDown={(event) => handleThumbMouseDown(event, 1)}
          position={positions[1]}
          ref={(node) => {
            // @ts-expect-error: HTMLDivElement
            thumbs.current[1] = node;
          }}
          showLabelOnHover={showLabelOnHover && hovered}
          size={sliderSize}
          value={_value[1]}
        />
      </Track>

      <input name={`${name}_from`} type="hidden" value={_value[0]} />
      <input name={`${name}_to`} type="hidden" value={_value[1]} />
    </SliderRoot>
  );
};

export default RangeSliderComponent;
