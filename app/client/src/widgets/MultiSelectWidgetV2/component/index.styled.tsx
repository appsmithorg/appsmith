import React from "react";
import { Checkbox, Classes, Label } from "@blueprintjs/core";
import styled, { keyframes } from "styled-components";
import { Colors } from "constants/Colors";
import { createGlobalStyle } from "constants/DefaultTheme";
import {
  FontStyleTypes,
  TextSize,
  TEXT_SIZES,
} from "constants/WidgetConstants";

const Input = styled.input`
  height: 0;
  width: 0;
  opacity: 0;
  z-index: -1;
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
  parentWidth: number;
  dropDownWidth: number;
  id: string;
}>`
${({ dropDownWidth, id, parentWidth }) => `
  .multiselect-popover-width-${id} {
    min-width: ${
      parentWidth > dropDownWidth ? parentWidth : dropDownWidth
    }px !important;
  }
`}
.rc-select-dropdown-hidden {
	display: none !important;
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
		margin-right: 10px;
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
  color: ${Colors.GREY_8};
  font-weight: 400;
}
.rc-select-item-option-active {
	background: ${Colors.GREEN_SOLID_LIGHT_HOVER};
  & .rc-select-item-option-content {
    color: ${Colors.GREY_9};
  }
}
.rc-select-item-option-selected {
	background: ${Colors.GREEN_SOLID_LIGHT_HOVER};

  & .rc-select-item-option-content {
    color: ${Colors.GREY_10};
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
	text-align: left;
  color: rgba(92, 112, 128, 0.6) !important
}
.multi-select-dropdown.rc-select-dropdown-empty {
  box-shadow: 0 0 2px rgba(0, 0, 0, 0.2) !important;
  border: 1px solid #E7E7E7;
  border-color: rgba(0,0,0,0.2);
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
  box-shadow: 0 6px 20px 0px rgba(0, 0, 0, 0.15) !important;
   overflow-x: scroll;
  > div {
      min-width: ${({ dropDownWidth }) => dropDownWidth}px;
    }
  &&&& .${Classes.ALIGN_LEFT} {
    font-size: 14px;
    padding-left: 42px;
    margin-bottom: 0;
    .${Classes.CONTROL_INDICATOR} {
      margin-right: 20px;
    }
    &.all-options.selected {
      background: ${Colors.GREEN_SOLID_LIGHT_HOVER};
      color: ${Colors.GREY_10} !important;
    }
  }
  &&&& .${Classes.CONTROL} .${Classes.CONTROL_INDICATOR} {
    background: transparent;
    box-shadow: none;
    border-width: 1px;
    border-style: solid;
    border-color: ${Colors.GREY_3};
    border-radius: 0px;
    &::before {
      width: auto;
      height: 1em;
    }
  }
  .${Classes.CONTROL} input:checked ~ .${Classes.CONTROL_INDICATOR} {
    background: ${Colors.GREEN_SOLID} !important;
    color: rgb(255, 255, 255);
    border-color: ${Colors.GREEN_SOLID} !important;
    box-shadow: none;
    outline: none !important;
  }

  & .${Classes.INPUT_GROUP} {
      padding: 12px 12px 8px 12px;
      min-width: 180px;

      & > .${Classes.ICON} {
        &:first-child {
          left: 12px;
          top: 14px;
          margin: 9px;
          color: ${Colors.GREY_7};

          & > svg {
            width: 14px;
            height: 14px;
          }
        }
      }
      & > .${Classes.INPUT_ACTION} {
        &:last-child {
          right: 13px;
          top: 13px;

          .${Classes.BUTTON} {
            min-height: 34px;
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
      .${Classes.INPUT} {
        height: 36px;
        padding-left: 29px !important;
        font-size: 14px;
        border: 1px solid ${Colors.GREY_3};
        color: ${Colors.GREY_10};
        box-shadow: 0px 0px 0px 0px;
        &:focus {
          border: 1.2px solid ${Colors.GREEN_SOLID};
          box-shadow: 0px 0px 0px 2px ${Colors.GREEN_SOLID_HOVER} !important;
        }
      }
    }
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
}>`
  display: flex;
  flex-direction: ${(props) => (props.compactMode ? "row" : "column")};
  align-items: ${(props) => (props.compactMode ? "center" : "left")};

  label.tree-multiselect-label {
    margin-bottom: ${(props) => (props.compactMode ? "0px" : "5px")};
    margin-right: ${(props) => (props.compactMode ? "10px" : "0px")};
  }
  .rc-select {
    display: inline-block;
    font-size: 12px;
    width: 100%;
    height: 100%;
    position: relative;
    cursor: pointer;
    .rc-select-selection-placeholder {
      pointer-events: none;
      position: absolute;
      top: 50%;
      right: 12px;
      left: 19px;
      transform: translateY(-50%);
      transition: all 0.3s;
      flex: 1;
      overflow: hidden;
      color: ${Colors.GREY_6};
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
  }
  && .rc-select-disabled {
    cursor: not-allowed;
    input {
      cursor: not-allowed;
    }
    & .rc-select-selector {
      background-color: ${Colors.GREY_1} !important;
      border: 1.2px solid ${Colors.GREY_3};
      .rc-select-selection-item-content {
        color: ${Colors.GREY_7};
      }
    }
    & .rc-select-arrow {
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
      box-shadow: none;
      border-radius: 0px;
      width: 100%;
      transition: border-color 0.15s ease-in-out 0s,
        box-shadow 0.15s ease-in-out 0s;
      background-color: white;
      .rc-select-selection-item {
        background: none;
        border: 1px solid ${Colors.GREY_3};
        border-radius: 360px;
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
        flex-wrap: wrap;
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
      padding-left: 12px;
      box-shadow: none;
      border-radius: 0px;
      height: inherit;
      width: 100%;
      transition: border-color 0.15s ease-in-out 0s,
        box-shadow 0.15s ease-in-out 0s;
      border: 1.2px solid
        ${(props) => (props.isValid ? Colors.GREY_3 : Colors.DANGER_SOLID)};
      &:hover {
        border: 1.2px solid
          ${(props) => (props.isValid ? Colors.GREY_3 : Colors.DANGER_SOLID)};
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
      fill: ${Colors.SLATE_GRAY};

      & svg {
        width: 20px;
        height: 20px;
      }
    }
  }
  .rc-select-show-arrow.rc-select-multiple.rc-select-focused {
    .rc-select-selector {
      outline: 0;
      ${(props) =>
        props.isValid
          ? `
          border: 1.2px solid ${Colors.GREEN_SOLID};
          box-shadow: 0px 0px 0px 2px ${Colors.GREEN_SOLID_HOVER};`
          : `border: 1.2px solid ${Colors.DANGER_SOLID};`}
    }
  }
`;
export const StyledCheckbox = styled(Checkbox)`
  &&.${Classes.CHECKBOX}.${Classes.CONTROL} {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    height: 38px;
    padding-bottom: 0 !important;
    color: ${Colors.GREY_8} !important;
    display: flex;
    align-items: center;
    &:hover {
      background: ${Colors.GREEN_SOLID_LIGHT_HOVER};
      color: ${Colors.GREY_9} !important;
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

export const TextLabelWrapper = styled.div<{
  compactMode: boolean;
}>`
  ${(props) =>
    props.compactMode ? "&&& {margin-right: 5px;}" : "width: 100%;"}
  display: flex;
`;

export const StyledLabel = styled(Label)<{
  $compactMode: boolean;
  $disabled: boolean;
  $labelText?: string;
  $labelTextColor?: string;
  $labelTextSize?: TextSize;
  $labelStyle?: string;
}>`
  overflow-y: hidden;
  text-overflow: ellipsis;
  width: ${(props) => (props.$compactMode ? "auto" : "100%")};
  text-align: left;
  color: ${(props) =>
    props.$labelTextColor
      ? props.$labelTextColor
      : props.$disabled
      ? Colors.GREY_8
      : "inherit"};
  font-size: ${(props) =>
    props.$labelTextSize ? TEXT_SIZES[props.$labelTextSize] : "14px"};
  font-weight: ${(props) =>
    props?.$labelStyle?.includes(FontStyleTypes.BOLD) ? "bold" : "normal"};
  font-style: ${(props) =>
    props?.$labelStyle?.includes(FontStyleTypes.ITALIC) ? "italic" : ""};
`;
