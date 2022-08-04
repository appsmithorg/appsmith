import React, { useRef, useState, useCallback, useEffect } from "react";
import throttle from "lodash/throttle";

import { getChangeValue, getPosition, SliderSizes } from "../utils";
import { useMove } from "../use-move";
import { Thumb } from "./Thumb";
import { Track } from "./Track";
import { SliderRoot } from "./SilderRoot";

export interface SingleSliderComponentProps
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

  /** Amount of digits after the decimal point */
  precision?: number;

  /** Current value for controlled slider */
  sliderValue: number;

  /** Called when user stops dragging slider or changes value with arrows */
  onChangeEnd(value: number): void;

  /** Hidden input name, use with uncontrolled variant */
  name: string;

  /** Marks which will be placed on the track */
  marks?: { value: number; label: string }[];

  /** If true label will be not be hidden when user stops dragging */
  labelAlwaysOn?: boolean;

  /** If true slider label will appear on hover */
  showLabelOnHover?: boolean;

  /** Disables slider */
  disabled?: boolean;
}

const SingleSliderComponent = (props: SingleSliderComponentProps) => {
  const {
    color,
    sliderValue,
    onChangeEnd,
    min,
    max,
    step,
    sliderSize,
    precision,
    name,
    marks = [],
    labelAlwaysOn = false,
    showLabelOnHover = true,
    disabled = false,
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
          precision,
        });
        setValue(nextValue);
        valueRef.current = nextValue;
      }
    },
    [disabled, min, max, step, precision],
  );

  const { active, ref: container } = useMove(handleChange, {
    onScrubEnd: () => onChangeEnd(valueRef.current),
  });

  const handleThumbMouseDown = (
    event: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>,
  ) => {
    if (event.cancelable) {
      event.preventDefault();
      event.stopPropagation();
    }
  };

  const throttledOnChangeEnd = throttle((value: number) => {
    onChangeEnd(value);
  }, 800);

  const handleTrackKeydownCapture = (
    event: React.KeyboardEvent<HTMLDivElement>,
  ) => {
    if (!disabled) {
      switch (event.key) {
        case "ArrowUp": {
          event.preventDefault();
          thumb.current?.focus();
          const nextValue = Math.min(Math.max(_value + step, min), max);
          throttledOnChangeEnd(nextValue);
          setValue(nextValue);
          break;
        }

        case "ArrowRight": {
          event.preventDefault();
          thumb.current?.focus();
          const nextValue = Math.min(Math.max(_value + step, min), max);
          throttledOnChangeEnd(nextValue);
          setValue(nextValue);
          break;
        }

        case "ArrowDown": {
          event.preventDefault();
          thumb.current?.focus();
          const nextValue = Math.min(Math.max(_value - step, min), max);
          throttledOnChangeEnd(nextValue);
          setValue(nextValue);
          break;
        }

        case "ArrowLeft": {
          event.preventDefault();
          thumb.current?.focus();
          const nextValue = Math.min(Math.max(_value - step, min), max);
          throttledOnChangeEnd(nextValue);
          setValue(nextValue);
          break;
        }

        default: {
          break;
        }
      }
    }
  };

  return (
    <SliderRoot
      disabled={disabled}
      onKeyDownCapture={handleTrackKeydownCapture}
      onMouseDownCapture={() => container.current?.focus()}
      // @ts-expect-error: MutableRefObject not assignable to Ref
      ref={container}
      size={sliderSize}
    >
      <Track
        color={color}
        disabled={disabled}
        filled={position}
        marks={marks}
        max={max}
        min={min}
        offset={0}
        onChange={setValue}
        onMouseEnter={showLabelOnHover ? () => setHovered(true) : undefined}
        onMouseLeave={showLabelOnHover ? () => setHovered(false) : undefined}
        size={sliderSize}
        value={_value}
      >
        <Thumb
          color={color}
          disabled={disabled}
          dragging={active}
          label={_value.toString()}
          labelAlwaysOn={labelAlwaysOn}
          max={max}
          min={min}
          onMouseDown={handleThumbMouseDown}
          position={position}
          // @ts-expect-error: MutableRefObject not assignable to Ref
          ref={thumb}
          showLabelOnHover={showLabelOnHover && hovered}
          size={sliderSize}
          value={_value}
        />
      </Track>

      <input name={name} type="hidden" value={_value} />
    </SliderRoot>
  );
};

export default SingleSliderComponent;
