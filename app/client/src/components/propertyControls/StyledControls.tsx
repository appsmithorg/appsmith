import * as React from "react";
import styled from "styled-components";
import type { ContainerOrientation } from "constants/WidgetConstants";
import { Input, Icon } from "@appsmith/ads";
import useInteractionAnalyticsEvent from "utils/hooks/useInteractionAnalyticsEvent";

interface ControlWrapperProps {
  orientation?: ContainerOrientation;
  isAction?: boolean;
}

export const ControlWrapper = styled.div<ControlWrapperProps>`
  display: ${(props) =>
    props.orientation === "HORIZONTAL" ? "flex" : "block"};
  justify-content: space-between;
  align-items: center;
  flex-direction: ${(props) =>
    props.orientation === "VERTICAL" ? "column" : "row"};
  padding-top: 4px;
  &:not(:last-of-type) {
    padding-bottom: 4px;
  }
  & > label {
    margin-bottom: ${(props) => props.theme.spaces[1]}px;
  }
  &&& > label:first-of-type {
    display: block;
  }
  &&& > label {
    display: inline-block;
  }
  &:focus-within .reset-button {
    display: block;
  }
`;

export const StyledDynamicInput = styled.div`
  width: 100%;
  &&& {
    input {
      border: none;
      color: ${(props) => props.theme.colors.textOnDarkBG};
      background: ${(props) => props.theme.colors.paneInputBG};
      &:focus {
        border: none;
        color: ${(props) => props.theme.colors.textOnDarkBG};
        background: ${(props) => props.theme.colors.paneInputBG};
      }
    }
  }
`;

export const FieldWrapper = styled.div`
  position: relative;
  width: 100%;
`;

export const StyledIcon = styled(Icon)`
  padding: 0;
  position: absolute;
  margin-right: 15px;
  cursor: move;
  z-index: 1;
  left: 4px;
  top: 50%;
  transform: translateY(-50%);
`;

/* Used in Draggable List Card component in Property pane */
export const StyledActionContainer = styled.div`
  position: absolute;
  right: 0px;
  margin-right: 10px;
  display: flex;
`;

export const StyledNavigateToFieldWrapper = styled.div`
  display: flex;
  justify-content: space-between;
  height: auto;
`;

export const StyledDividerContainer = styled.div`
  width: 1%;
  margin-top: 9px;
`;

export const StyledNavigateToFieldsContainer = styled.div`
  width: 95%;
`;

interface InputGroupProps {
  autoFocus?: boolean;
  className?: string;
  dataType?: string;
  onBlur?: () => void;
  onFocus?: () => void;
  placeholder?: string;
  value?: string;
  width?: string;
  onChange?: (value: string) => void;
  defaultValue?: string;
  tabIndex?: number;
}

export const InputGroup = React.forwardRef((props: InputGroupProps, ref) => {
  let inputRef = React.useRef<HTMLInputElement>(null);
  const wrapperRef = React.useRef<HTMLInputElement>(null);
  const { dispatchInteractionAnalyticsEvent } =
    useInteractionAnalyticsEvent<HTMLInputElement>(false, wrapperRef);

  if (ref) inputRef = ref as React.RefObject<HTMLInputElement>;

  React.useEffect(() => {
    window.addEventListener("keydown", handleKeydown);

    return () => {
      window.removeEventListener("keydown", handleKeydown);
    };
  }, []);

  const handleKeydown = (e: KeyboardEvent) => {
    switch (e.key) {
      case "Enter":
      case " ":
        if (document.activeElement === wrapperRef?.current) {
          dispatchInteractionAnalyticsEvent({ key: e.key });
          inputRef?.current?.focus();
          e.preventDefault();
        }

        break;
      case "Escape":
        if (document.activeElement === inputRef?.current) {
          dispatchInteractionAnalyticsEvent({ key: e.key });
          wrapperRef?.current?.focus();
          e.preventDefault();
        }

        break;
      case "Tab":
        if (document.activeElement === wrapperRef?.current) {
          dispatchInteractionAnalyticsEvent({
            key: `${e.shiftKey ? "Shift+" : ""}${e.key}`,
          });
        }

        break;
    }
  };

  return (
    <div className="w-full" ref={wrapperRef} tabIndex={0}>
      <Input ref={inputRef} {...props} size="md" tabIndex={-1} />
    </div>
  );
});
