import React from "react";
import { Checkbox, Classes } from "@blueprintjs/core";
import styled, { css, keyframes } from "styled-components";
import { Colors } from "constants/Colors";
import { createGlobalStyle } from "constants/DefaultTheme";
import {
  LabelPosition,
  LABEL_MARGIN_OLD_SELECT,
  SELECT_DEFAULT_HEIGHT,
} from "components/constants";
import {
  labelLayoutStyles,
  LABEL_CONTAINER_CLASS,
  multiSelectInputContainerStyles,
} from "design-system";
import { lightenColor } from "widgets/WidgetUtils";
import CheckIcon from "assets/icons/widget/checkbox/check-icon.svg";

const Input = styled.input`
  height: 0;
  width: 0;
  opacity: 0;
  z-index: -1;
`;

export const CommonSelectFilterStyle = css<{
  accentColor?: string;
  borderRadius?: string;
}>`
  &&&& .${Classes.ALIGN_LEFT} {
    font-size: 14px;
    padding-left: 42px;
    margin-bottom: 0;
    .${Classes.CONTROL_INDICATOR} {
      margin-right: 10px;
    }
    &.all-options.selected {
      color: ${Colors.GREY_10} !important;
    }
  }

  &&&& .${Classes.CONTROL} .${Classes.CONTROL_INDICATOR} {
    background: transparent;
    box-shadow: none;
    border-width: 1px;
    border-style: solid;
    border-color: var(--wds-color-border);
    border-radius: 0px;
    &::before {
      width: auto;
      height: 100%;
    }
  }

  & .${Classes.INPUT} {
    height: 30px !important;
    padding-left: 34px !important;
    font-size: 14px;
    color: var(--wds-color-text);
    box-shadow: 0px 0px 0px 0px;
    border: none;
  }

  & .${Classes.INPUT}::placeholder {
    color: var(--wds-color-text-light);
  }

  & .${Classes.INPUT_GROUP} {
    margin: 12px 12px 8px 12px;
    position: relative;
    border: 1px solid var(--wds-color-border);
    border-radius: ${({ borderRadius }) =>
      borderRadius === "1.5rem" ? `0.375rem` : borderRadius};
    overflow: hidden;
    &:focus-within {
      border: 1px solid ${(props) => props.accentColor};
      box-shadow: 0px 0px 0px 2px ${(props) => lightenColor(props.accentColor)};
    }

    & > .${Classes.ICON} {
      &:first-child {
        left: 0px;
        top: 0px;
        bottom: 0px;
        margin: 8px 10px;
        color: var(--wds-color-icon);

        & > svg {
          width: 14px;
          height: 14px;
        }
      }
    }
    & > .${Classes.INPUT_ACTION} {
      &:last-child {
        right: 0px;
        top: 0px;
        bottom: 0px;

        .${Classes.BUTTON} {
          min-height: 100%;
          min-width: 35px;
          margin: 0px;
          color: ${Colors.GREY_6} !important;

          &:hover {
            color: ${Colors.GREY_10} !important;
            background: ${Colors.GREY_2};
            border-radius: 0;
          }
        }
      }
    }
  }
`;

const Indicator = styled.div`
  width: 1.2em;
  height: 1.2em;
  background: #e6e6e6;
  position: absolute;
  top: 0em;
  /* left: -1.6em; */
  border: 1px solid #757575;
  border-radius: 0.2em;

  ${Input}:not(:disabled):checked & {
    background: #d1d1d1;
  }

  &::disabled {
    cursor: not-allowed;
  }

  &::before {
    height: 100% !important;
  }
`;

export default function MenuItemCheckBox({ checked }: { checked: boolean }) {
  return (
    <div className={`${Classes.CONTROL} ${Classes.CHECKBOX}`}>
      <Input checked={checked} type="checkbox" />
      <Indicator className={Classes.CONTROL_INDICATOR} />
    </div>
  );
}

const rcSelectDropdownSlideUpIn = keyframes`
	0% {
		opacity: 0;
		transform-origin: 0% 0%;
	}

	100% {
		opacity: 1;
		transform-origin: 0% 0%;
	}
`;

const rcSelectDropdownSlideUpOut = keyframes`
	0% {
		opacity: 1;
		transform-origin: 0% 0%;
	}

100% {
		opacity: 0;
		transform-origin: 0% 0%;
	}
`;

export const DropdownStyles = createGlobalStyle<{
  dropDownWidth: number;
  id: string;
  accentColor?: string;
  borderRadius: string;
}>`
${({ dropDownWidth, id }) => `
  .multiselect-popover-width-${id} {
    width: ${dropDownWidth}px !important;
    min-width: ${dropDownWidth}px !important;
  }
`}
.rc-select-dropdown-hidden {
	display: none;
}
.rc-select-item-group {
	color: #999;
	font-weight: bold;
	font-size: 80%;
}
.rc-select-item-option {
	position: relative;
	display: flex;
	flex-direction: row-reverse;

	.rc-select-item-option-state {
		pointer-events: all;
		margin-right: 0px;
	}
}
.rc-select-item-option-grouped {
	padding-left: 24px;
}
.rc-select-item-option-content {
	flex: 1 1 0;
  overflow-wrap: break-word;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: var(--wds-color-text);
  font-weight: 400;
}
.rc-select-item-option-active {
  background: var(--wds-color-bg-focus) !important;
  color: var(--wds-color-text);

  & .${Classes.CONTROL} .${Classes.CONTROL_INDICATOR} {
    border-color: var(--wds-color-border-hover) !important;
  }
}
.rc-select-item-option:hover {
	background: var(--wds-color-bg-hover);

  & .${Classes.CONTROL} .${Classes.CONTROL_INDICATOR} {
    border-color: var(--wds-color-border-hover) !important;
  }

  & .rc-select-item-option-content {
    color: var(--wds-color-text);
  }
}
.rc-select-item-option-selected {
  & .rc-select-item-option-content {
    color: var(--wds-color-text);
  }
}
.rc-select-item-option-disabled {
	color: #999;
}
.rc-select-item-empty {
	text-align: center;
	color: #999;
}
.rc-select-item-empty {
	text-align: center;
  padding: 10px;
  color: rgba(92, 112, 128, 0.6) !important
}
.multi-select-dropdown.rc-select-dropdown-empty {
  box-shadow: 0 6px 20px 0px rgba(0, 0, 0, 0.15) !important;
  border: 0px solid #E7E7E7;
  min-height: fit-content;
}
.rc-select-selection__choice-zoom {
	transition: all 0s;
}
.rc-select-selection__choice-zoom-appear {
	opacity: 0;
}
.rc-select-selection__choice-zoom-appear.rc-select-selection__choice-zoom-appear-active {
	opacity: 1;
}
.rc-select-selection__choice-zoom-leave {
	opacity: 1;
}
.rc-select-selection__choice-zoom-leave.rc-select-selection__choice-zoom-leave-active {
	opacity: 0;
}
.rc-select-dropdown-slide-up-enter {
	animation-duration: 0s;
	animation-fill-mode: both;
	transform-origin: 0 0;
	opacity: 0;
	animation-timing-function: cubic-bezier(0.08, 0.82, 0.17, 1);
	animation-play-state: paused;
}
.rc-select-dropdown-slide-up-appear {
	animation-duration: 0s;
	animation-fill-mode: both;
	transform-origin: 0 0;
	opacity: 0;
	animation-timing-function: cubic-bezier(0.08, 0.82, 0.17, 1);
	animation-play-state: paused;
}
.rc-select-dropdown-slide-up-leave {
	animation-duration: 0s;
	animation-fill-mode: both;
	transform-origin: 0 0;
	opacity: 1;
	animation-timing-function: cubic-bezier(0.6, 0.04, 0.98, 0.34);
	animation-play-state: paused;
}
.rc-select-dropdown-slide-up-enter.rc-select-dropdown-slide-up-enter-active.rc-select-dropdown-placement-bottomLeft {
	animation-name: ${rcSelectDropdownSlideUpIn};
	animation-play-state: running;
}
.rc-select-dropdown-slide-up-appear.rc-select-dropdown-slide-up-appear-active.rc-select-dropdown-placement-bottomLeft {
	animation-name:${rcSelectDropdownSlideUpIn};
	animation-play-state: running;
}
.rc-select-dropdown-slide-up-leave.rc-select-dropdown-slide-up-leave-active.rc-select-dropdown-placement-bottomLeft {
	animation-name: ${rcSelectDropdownSlideUpOut};
	animation-play-state: running;
}
.rc-select-dropdown-slide-up-enter.rc-select-dropdown-slide-up-enter-active.rc-select-dropdown-placement-topLeft {
	animation-name:  ${rcSelectDropdownSlideUpIn};
	animation-play-state: running;
}
.rc-select-dropdown-slide-up-appear.rc-select-dropdown-slide-up-appear-active.rc-select-dropdown-placement-topLeft {
	animation-name:  ${rcSelectDropdownSlideUpIn};
	animation-play-state: running;
}
.rc-select-dropdown-slide-up-leave.rc-select-dropdown-slide-up-leave-active.rc-select-dropdown-placement-topLeft {
	animation-name: ${rcSelectDropdownSlideUpOut};
	animation-play-state: running;
}
.multi-select-dropdown {
  min-height: 100px;
  position: absolute;
  background: #fff;
  width: auto;
  border-radius: 0px;
  margin-top: 5px;
  background: white;
  border-radius: ${({ borderRadius }) =>
    borderRadius === "1.5rem" ? `0.375rem` : borderRadius};
  overflow: hidden;
  box-shadow: 0 6px 20px 0px rgba(0, 0, 0, 0.15) !important;
   overflow-x: auto;
  &&&& .${Classes.ALIGN_LEFT} {
    font-size: 14px;
    padding-left: 42px;
    margin-bottom: 0;
    .${Classes.CONTROL_INDICATOR} {
      margin-right: 0px;
    }
    &.all-options.selected {
      color: var(--wds-color-text) !important;
    }
  }
  &&&& .${Classes.CONTROL} .${Classes.CONTROL_INDICATOR} {
    background: transparent;
    box-shadow: none;
    border-width: 1px;
    border-style: solid;
    border-color: ${Colors.GREY_3};
    border-radius: ${({ borderRadius }) => borderRadius} !important;
    &::before {
      width: auto;
      height: 1em;
    }
  }

  .${Classes.CONTROL} input:checked ~ .${Classes.CONTROL_INDICATOR} {
    background: ${({ accentColor }) => accentColor} !important;
    color: rgb(255, 255, 255);
    border-color: ${({ accentColor }) => accentColor} !important;
    box-shadow: none;
    outline: none !important;

    &::before {
      background-image: url(${CheckIcon}) !important;
      background-repeat: no-repeat !important;
      background-position: center !important;
    }
  }
  ${CommonSelectFilterStyle}
  .rc-select-item {
    font-size: 14px;
    padding: 5px 16px;
    align-items: center;
    cursor: pointer;
    width: 100%;
    height: 38px;
  }
  .rc-select-item-option-state {
    .bp3-control.bp3-checkbox {
      margin-bottom: 0;
    }
  }
}
`;

export const MultiSelectContainer = styled.div<{
  compactMode: boolean;
  isValid: boolean;
  labelPosition?: LabelPosition;
  borderRadius: string;
  boxShadow?: string;
  accentColor?: string;
}>`
  ${labelLayoutStyles}
  & .${LABEL_CONTAINER_CLASS} {
    label {
      ${({ labelPosition }) => {
        if (!labelPosition) {
          return `margin-bottom: ${LABEL_MARGIN_OLD_SELECT}`;
        }
      }};
    }
  }

  .rc-select {
    display: inline-block;
    font-size: 12px;
    width: 100%;
    height: 100%;
    position: relative;
    cursor: pointer;

    ${({ compactMode, labelPosition }) =>
      labelPosition !== LabelPosition.Top && compactMode && `height: 100%;`};

    .rc-select-selection-placeholder {
      pointer-events: none;
      position: absolute;
      top: 50%;
      right: 12px;
      left: 10px;
      transform: translateY(-50%);
      transition: all 0.3s;
      flex: 1;
      overflow: hidden;
      color: var(--wds-color-text-light);
      white-space: nowrap;
      text-overflow: ellipsis;
      pointer-events: none;
      font-size: 14px;
    }
    .rc-select-selection-search-input {
      appearance: none;
      &::-webkit-search-cancel-button {
        display: none;
        appearance: none;
      }
    }
    .rc-select-selection-overflow-item-suffix {
      position: relative !important;
      left: 0px !important;
    }
  }
  && .rc-select-disabled {
    cursor: not-allowed;
    input {
      cursor: not-allowed;
    }
    & .rc-select-selector {
      background-color: var(--wds-color-bg-disabled) !important;
      border: 1px solid var(--wds-color-border-disabled) !important;

      .rc-select-selection-item {
        border-color: var(--wds-color-border-disabled);
      }
      .rc-select-selection-item-content {
        color: var(--wds-color-text-disabled) !important;
      }
    }

    & .rc-select-selection-placeholder {
      color: var(--wds-color-text-disabled-light);
    }

    & .rc-select-arrow svg path {
      fill: var(--wds-color-icon-disabled);
    }
  }
  .rc-select-show-arrow.rc-select-loading {
    .rc-select-arrow-icon {
      &::after {
        box-sizing: border-box;
        width: 12px;
        height: 12px;
        border-radius: 100%;
        border: 2px solid #999;
        border-top-color: transparent;
        border-bottom-color: transparent;
        transform: none;
        margin-top: 4px;
        animation: rcSelectLoadingIcon 0.5s infinite;
      }
    }
  }
  .rc-select-multiple {
    .rc-select-selector {
      padding-right: 20px;
      display: flex;
      flex-wrap: wrap;
      padding: 1px;
      background: var(--wds-color-bg);
      border-radius: ${({ borderRadius }) => borderRadius} !important;
      box-shadow: ${({ boxShadow }) => `${boxShadow}`} !important;
      width: 100%;
      transition: none;
      background-color: white;

      .rc-select-selection-item {
        background: none;
        border: 1px solid ${Colors.GREY_3};
        border-radius: ${({ borderRadius }) => borderRadius} !important;
        max-width: 273.926px;
        height: 20px;
        color: ${Colors.GREY_10};
        overflow-wrap: break-word;
        display: inline-flex;
        flex-direction: row;
        align-items: center;
        box-shadow: none;
        font-size: 12px;
        line-height: 19px;
        min-height: 20px;
        min-width: 20px;
        position: relative;
        overflow: hidden;
        margin-right: 4px;
      }
      .rc-select-selection-item-disabled {
        cursor: not-allowed;
        opacity: 0.5;
      }
      .rc-select-selection-overflow {
        display: flex;
        width: 100%;
        align-items: center;
      }
      .rc-select-selection-overflow-item {
        flex: none;
        max-width: 100%;
      }
      .rc-select-selection-search {
        position: relative;
        max-width: 100%;
        margin-bottom: 2px;
        -webkit-margin-start: 7px;
        margin-inline-start: 5px;
        height: 100%;
        display: flex;
        align-items: center;
      }
      .rc-select-selection-search-input {
        padding: 1px;
        font-family: system-ui;
        width: 5px;
        margin: 0px;
        display: flex;
        height: 26px;
        flex: 1 1 0%;
        border: none;
        outline: none;
        width: 100%;
      }
      .rc-select-selection-search-mirror {
        padding: 1px;
        font-family: system-ui;
        width: 5px;
        margin: 0px;
        display: flex;
        height: 26px;
        flex: 1 1 0%;
        position: absolute;
        z-index: 999;
        white-space: nowrap;
        position: none;
        left: 0;
        top: 0;
        visibility: hidden;
      }
    }
  }
  .rc-select-selection-item-content {
    flex-grow: 1;
    flex-shrink: 1;
    margin: 0 4px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    word-wrap: normal;
    font-size: 12px;
    line-height: 18px;
  }
  .rc-select-selection-item-remove {
    width: 20px;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    &:hover {
      background-color: ${Colors.GREY_2};
    }
  }
  .rc-select-allow-clear {
    .rc-select-clear {
      position: absolute;
      right: 20px;
      top: 0;
    }
  }
  .rc-select-show-arrow.rc-select-multiple {
    .rc-select-selector {
      padding-right: 36px;
      padding-left: 10px;
      background: var(--wds-color-bg);
      border-radius: ${({ borderRadius }) => borderRadius};
      box-shadow: ${({ boxShadow }) => `${boxShadow}`} !important;
      height: inherit;
      width: 100%;
      transition: none;
      border: 1px solid
        ${(props) =>
          props.isValid
            ? "var(--wds-color-border)"
            : "var(--wds-color-border-danger)"};
      &:hover {
        border: 1px solid
        ${(props) =>
          props.isValid
            ? "var(--wds-color-border-hover)"
            : "var(--wds-color-border-danger-hover)"};
      }
    }
  }
  .rc-select-show-arrow {
    .rc-select-arrow {
      pointer-events: none;
      position: absolute;
      right: 0;
      top: 0;
      height: 100%;
      width: 36px;
      display: flex;
      align-items: center;
      justify-content: center;
      fill: var(--wds-color-icon);

      & svg {
        width: 20px;
        height: 20px;
        fill: var(--wds-color-icon);

        path {
          fill: var(--wds-color-icon);
        }
      }
    }
  }
  .rc-select-show-arrow.rc-select-multiple.rc-select-focused {
    .rc-select-selector {
      outline: 0;

      ${(props) =>
        props.isValid
          ? `
          border: 1px solid  ${props.accentColor};
          box-shadow: 0px 0px 0px 2px ${lightenColor(
            props.accentColor,
          )} !important;`
          : `border: 1px solid var(--wds-color-border-danger); box-shadow: 0px 0px 0px 2px var(--wds-color-border-danger-focus-light) !important;`}
    }
  }
`;
export const StyledCheckbox = styled(Checkbox)<{
  accentColor?: string;
}>`
  &&.${Classes.CHECKBOX}.${Classes.CONTROL} {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    height: 38px;
    padding-bottom: 0 !important;
    color: var(--wds-color-text) !important;
    display: flex;
    align-items: center;
    padding-left: 16px !important;
    & .${Classes.CONTROL_INDICATOR} {
      margin: 0;
      margin-right: 10px;
    }
    &:hover {
      background: var(--wds-color-bg-hover);
      color: var(--wds-color-text) !important;

      & .${Classes.CONTROL_INDICATOR} {
        border-color: var(--wds-color-border-hover) !important;
      }
    }

    & input:checked ~ .${Classes.CONTROL_INDICATOR} {
      border-color: ${({ accentColor }) => accentColor} !important;
    }
  }
`;

export const inputIcon = (): JSX.Element => (
  <svg data-icon="chevron-down" height="16" viewBox="0 0 16 16" width="16">
    <desc>chevron-down</desc>
    <path
      d="M12 5c-.28 0-.53.11-.71.29L8 8.59l-3.29-3.3a1.003 1.003 0 00-1.42 1.42l4 4c.18.18.43.29.71.29s.53-.11.71-.29l4-4A1.003 1.003 0 0012 5z"
      fillRule="evenodd"
    />
  </svg>
);

export const InputContainer = styled.div<{
  compactMode: boolean;
  labelPosition?: LabelPosition;
}>`
  ${multiSelectInputContainerStyles}
  ${({ labelPosition }) => labelPosition && `height: ${SELECT_DEFAULT_HEIGHT}`};
`;
