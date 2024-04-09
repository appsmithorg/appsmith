import { Colors } from "constants/Colors";
import { isNil } from "lodash";
import React, {
  useCallback,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import styled from "styled-components";
import type { InputHTMLType } from "widgets/BaseInputWidget/component";
import BaseInputComponent from "widgets/BaseInputWidget/component";
import { InputTypes } from "widgets/BaseInputWidget/constants";
import type { EditableCell } from "widgets/wds/WDSTableWidget/constants";
import type { VerticalAlignment } from "../Constants";
import { EDITABLE_CELL_PADDING_OFFSET, TABLE_SIZES } from "../Constants";
import {
  getLocaleDecimalSeperator,
  getLocaleThousandSeparator,
} from "widgets/WidgetUtils";
import { limitDecimalValue } from "widgets/CurrencyInputWidget/component/utilities";
import * as Sentry from "@sentry/react";
import { getLocale } from "utils/helpers";
import { TextArea } from "@design-system/widgets";

const FOCUS_CLASS = "has-focus";

const Wrapper = styled.div<{
  accentColor: string;
  compactMode: string;
  allowCellWrapping?: boolean;
  verticalAlignment?: VerticalAlignment;
  textSize?: string;
  isEditableCellValid: boolean;
  paddedInput: boolean;
}>`
  padding: 1px;
  border: 1px solid
    ${(props) => (!props.isEditableCellValid ? Colors.DANGER_SOLID : "#fff")};
  background: #fff;
  position: absolute;
  overflow: hidden;
  border-radius: 3px;
  inset: 0;
`;

function convertToNumber(inputValue: string) {
  inputValue = inputValue.replace(
    new RegExp(`[${getLocaleDecimalSeperator()}]`),
    ".",
  );

  const parsedValue = Number(inputValue);

  if (isNaN(parsedValue) || inputValue.trim() === "" || isNil(inputValue)) {
    return null;
  } else if (Number.isFinite(parsedValue)) {
    return parsedValue;
  } else {
    return null;
  }
}

interface InlineEditorPropsType {
  accentColor: string;
  compactMode: string;
  inputType: InputTypes;
  inputHTMLType: InputHTMLType;
  multiline: boolean;
  onChange: (value: EditableCell["value"], inputValue: string) => void;
  onDiscard: () => void;
  onSave: () => void;
  value: any;
  allowCellWrapping?: boolean;
  verticalAlignment?: VerticalAlignment;
  textSize?: string;
  isEditableCellValid: boolean;
  validationErrorMessage: string;
  widgetId: string;
  paddedInput: boolean;
  autoFocus: boolean;
  additionalProps: Record<string, unknown>;
}

export function InlineCellEditor({
  accentColor,
  additionalProps = {},
  allowCellWrapping,
  autoFocus,
  compactMode,
  inputHTMLType,
  inputType = InputTypes.TEXT,
  isEditableCellValid,
  multiline,
  onChange,
  onDiscard,
  onSave,
  textSize,
  validationErrorMessage,
  value,
  verticalAlignment,
  widgetId,
}: InlineEditorPropsType) {
  const inputRef = useRef<HTMLTextAreaElement | HTMLInputElement>(null);
  const [hasFocus, setHasFocus] = useState(false);
  const [cursorPos, setCursorPos] = useState(value.length);

  const onFocusChange = useCallback(
    (focus: boolean) => {
      !focus && onSave();
      setHasFocus(focus);
    },
    [onSave],
  );

  const onKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const { key } = event;

      switch (key) {
        case "Escape":
          onDiscard();
          break;
        case "Enter":
          if (!event.shiftKey) {
            onSave();
            event.preventDefault();
          }
          break;
      }
    },
    [onDiscard, onSave],
  );

  const onTextChange = useCallback(
    (inputValue: string) => {
      setCursorPos(inputRef.current?.selectionStart);

      let value: EditableCell["value"] = inputValue;

      if (inputType === InputTypes.NUMBER) {
        value = convertToNumber(inputValue);
      } else if (inputType === InputTypes.CURRENCY) {
        const decimalSeperator = getLocaleDecimalSeperator();

        try {
          if (inputValue && inputValue.includes(decimalSeperator)) {
            inputValue = limitDecimalValue(
              additionalProps.decimals as number,
              inputValue,
            );
          }

          value = convertToNumber(inputValue);
        } catch (e) {
          Sentry.captureException(e);
        }
      }

      onChange(value, inputValue);
    },
    [setCursorPos, onChange, inputType],
  );

  useLayoutEffect(() => {
    if (inputRef.current) {
      inputRef.current.selectionStart = cursorPos;

      if (cursorPos < value.length) {
        inputRef.current.selectionEnd = cursorPos;
      }
    }
  }, [multiline]);

  const parsedValue = useMemo(() => {
    if (inputType === InputTypes.CURRENCY && typeof value === "number") {
      return Intl.NumberFormat(getLocale(), {
        style: "decimal",
        minimumFractionDigits: additionalProps.decimals as number,
        maximumFractionDigits: additionalProps.decimals as number,
      })
        .format(value)
        .replaceAll(getLocaleThousandSeparator(), "");
    } else {
      return value;
    }
  }, [value]);

  return (
    <TextArea
      autoFocus={hasFocus || autoFocus}
      errorMessage={validationErrorMessage}
    />
  );
}
