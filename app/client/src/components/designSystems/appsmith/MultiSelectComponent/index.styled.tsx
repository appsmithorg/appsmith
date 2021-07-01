import React from "react";
import { Checkbox, Classes } from "@blueprintjs/core";
import styled, { keyframes } from "styled-components";
import { Colors } from "constants/Colors";
import { createGlobalStyle } from "constants/DefaultTheme";

const rcSelectDropdownSlideUpIn = keyframes`
	0% {
		opacity: 0;
		transform-origin: 0% 0%;
		transform: scaleY(0);
	}

	100% {
		opacity: 1;
		transform-origin: 0% 0%;
		transform: scaleY(1);
	}
`;

const rcSelectDropdownSlideUpOut = keyframes`
	0% {
		opacity: 1;
		transform-origin: 0% 0%;
		transform: scaleY(1);
	}

100% {
		opacity: 0;
		transform-origin: 0% 0%;
		transform: scaleY(0);
	}
`;

export const DropdownStyles = createGlobalStyle`
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
		margin-right: 10px;
	}
}
.rc-select-item-option-grouped {
	padding-left: 24px;
}
.rc-select-item-option-content {
	flex: 1 1 0;
}
.rc-select-item-option-active {
	background: rgb(233, 250, 243);
}
.rc-select-item-option-selected {
	background: rgb(233, 250, 243);
}
.rc-select-item-option-disabled {
	color: #999;
}
.rc-select-item-empty {
	text-align: center;
	color: #999;
}
.rc-select-selection__choice-zoom {
	transition: all 0.3s;
}
.rc-select-selection__choice-zoom-appear {
	opacity: 0;
	transform: scale(0.5);
}
.rc-select-selection__choice-zoom-appear.rc-select-selection__choice-zoom-appear-active {
	opacity: 1;
	transform: scale(1);
}
.rc-select-selection__choice-zoom-leave {
	opacity: 1;
	transform: scale(1);
}
.rc-select-selection__choice-zoom-leave.rc-select-selection__choice-zoom-leave-active {
	opacity: 0;
	transform: scale(0.5);
}
.rc-select-dropdown-slide-up-enter {
	animation-duration: 0.3s;
	animation-fill-mode: both;
	transform-origin: 0 0;
	opacity: 0;
	animation-timing-function: cubic-bezier(0.08, 0.82, 0.17, 1);
	animation-play-state: paused;
}
.rc-select-dropdown-slide-up-appear {
	animation-duration: 0.3s;
	animation-fill-mode: both;
	transform-origin: 0 0;
	opacity: 0;
	animation-timing-function: cubic-bezier(0.08, 0.82, 0.17, 1);
	animation-play-state: paused;
}
.rc-select-dropdown-slide-up-leave {
	animation-duration: 0.3s;
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
    min-width: 170px !important;

	position: absolute;
	background: #fff;
	width: 100%;
	border: 1px solid rgba(0, 0, 0, 0.2);
	border-radius: 0px;
	margin-top: 8px;
	padding: 8px;
	background: white;
	box-shadow: rgb(0 0 0 / 20%) 0px 0px 2px !important;
    &&&& .${Classes.ALIGN_LEFT} {
        font-size: 16px;
        padding-bottom: 10px;
        margin-left: 16px ;
      .${Classes.CONTROL_INDICATOR} {
        margin-right: 20px;
      }
    }
      &&&& .${Classes.CONTROL} .${Classes.CONTROL_INDICATOR} {
      background: white;
      box-shadow: none;
      border-width: 2px;
      border-style: solid;
      border-color: ${Colors.GEYSER};
      &::before {
        width: auto;
        height: 1em;
      }
    }
    .${Classes.CONTROL} input:checked ~ .${Classes.CONTROL_INDICATOR} {
      background: rgb(3, 179, 101) !important;
						color: rgb(255, 255, 255);
						border-color: rgb(3, 179, 101) !important;
						box-shadow: none;
						outline: none !important;
    }
    .rc-select-item {
	font-size: 16px;
	line-height: 1.5;
	padding: 5px 16px;
	align-items: center;
	cursor: pointer;
}
.rc-select-item-option-state {
	.bp3-control.bp3-checkbox {
		margin-bottom: 0;
	}
}
  }
`;

export const MultiSelectContainer = styled.div`
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
      right: 11px;
      left: 11px;
      transform: translateY(-50%);
      transition: all 0.3s;
      flex: 1;
      overflow: hidden;
      color: #bfbfbf;
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
  .rc-select-disabled {
    cursor: not-allowed;
    input {
      cursor: not-allowed;
    }
    .rc-select-selector {
      opacity: 0.3;
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
      border: 1px solid rgb(231, 231, 231);
      border-radius: 0px;
      width: 100%;
      transition: border-color 0.15s ease-in-out 0s,
        box-shadow 0.15s ease-in-out 0s;
      background-color: white;
      .rc-select-selection-item {
        background: none;
        border: 1px solid rgb(208, 215, 221);
        border-radius: 2px;
        margin: 3px 2px;
        max-width: 273.926px;
        height: 24px;
        color: #182026;
        overflow-wrap: break-word;
        display: inline-flex;
        flex-direction: row;
        align-items: center;
        box-shadow: none;
        font-size: 12px;
        line-height: 16px;
        min-height: 20px;
        min-width: 20px;
        padding: 2px 6px;
        position: relative;
      }
      .rc-select-selection-item-disabled {
        cursor: not-allowed;
        opacity: 0.5;
      }
      .rc-select-selection-overflow {
        display: flex;
        flex-wrap: wrap;
        width: 100%;
        align-content: center;
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
    margin-right: 4px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    word-wrap: normal;
    font-size: 12px;
    line-height: 16px;
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
      padding-right: 20px;
      box-shadow: none;
      border: 1px solid rgb(231, 231, 231);
      border-radius: 0px;
      height: inherit;
      width: 100%;
      transition: border-color 0.15s ease-in-out 0s,
        box-shadow 0.15s ease-in-out 0s;
    }
  }
  .rc-select-show-arrow {
    .rc-select-arrow {
      pointer-events: none;
      position: absolute;
      right: 5px;
      top: 0;
      height: 100%;
      display: flex;
      align-items: center;
    }
    .rc-select-arrow-icon {
      &::after {
        content: "";
        border: 5px solid transparent;
        width: 0;
        height: 0;
        display: inline-block;
        border-top-color: #999;
        transform: translateY(5px);
      }
    }
  }
  .rc-select-show-arrow.rc-select-multiple.rc-select-focused {
    .rc-select-selector {
      border: 1px solid rgb(128, 189, 255);
      outline: 0px;
      box-shadow: rgba(0, 123, 255, 0.25) 0px 0px 0px 0.1rem;
    }
  }
`;
export const StyledCheckbox = styled(Checkbox)`
  &&.${Classes.CHECKBOX}.${Classes.CONTROL} {
    margin: 0;
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
