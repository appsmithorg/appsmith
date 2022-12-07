import React from "react";
import { Checkbox, Classes } from "@blueprintjs/core";
import styled, { keyframes } from "styled-components";
import { Colors } from "constants/Colors";
import { createGlobalStyle } from "constants/DefaultTheme";
import {
  LabelPosition,
  LABEL_MARGIN_OLD_SELECT,
  SELECT_DEFAULT_HEIGHT,
} from "components/constants";
import { CommonSelectFilterStyle } from "widgets/MultiSelectWidgetV2/component/index.styled";
import { Icon, labelLayoutStyles, LABEL_CONTAINER_CLASS } from "design-system";
import { lightenColor } from "widgets/WidgetUtils";

export const StyledIcon = styled(Icon)<{ expanded: boolean }>`
  transform: rotate(${({ expanded }) => (expanded ? 0 : 270)}deg);

  svg {
    width: 16px;
    height: 16px;
  }
`;

export const menuItemSelectedIcon = (props: { isSelected: boolean }) => {
  return <StyledCheckbox checked={props.isSelected} />;
};

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
  accentColor: string;
  borderRadius: string;
}>`
${({ dropDownWidth, id }) => `
  .treeselect-popover-width-${id} {
    min-width: ${dropDownWidth}px !important;
     width: ${dropDownWidth}px !important;
  }
`}
.rc-tree-select-dropdown-hidden {
	display: none;
}
.rc-tree-select-item-group {
	color: #999;
	font-weight: bold;
	font-size: 80%;
}
.rc-tree-select-item-option {
	position: relative;
	display: flex;

	flex-direction: row-reverse;
	.rc-tree-select-item-option-state {
		pointer-events: all;
		margin-right: 10px;
	}
}
.rc-tree-select-item-option-grouped {
	padding-left: 24px;
}
.rc-tree-select-item-option-content {
	flex: 1 1 0;
}
.rc-tree-select-item-option-active {
	background: rgb(233, 250, 243);
}
.rc-tree-select-item-option-selected {
	background: rgb(233, 250, 243);
}
.rc-tree-select-item-option-disabled {
	color: #999;
}
.rc-tree-select-item-empty {
	text-align: center;
	color: #999;
}
.rc-tree-select-dropdown-empty {
  color: rgba(92, 112, 128, 0.6) !important
}
.single-tree-select-dropdown.rc-tree-select-dropdown-empty {
  box-shadow: 0 0 2px rgba(0, 0, 0, 0.2) !important;
  border: 1px solid #E7E7E7;
  border-color: rgba(0,0,0,0.2);
  min-height: fit-content;
}

.rc-tree-select-selection__choice-zoom {
	transition: all 0s;
}
.rc-tree-select-selection__choice-zoom-appear {
	opacity: 0;
}
.rc-tree-select-selection__choice-zoom-appear.rc-tree-select-selection__choice-zoom-appear-active {
	opacity: 1;
}
.rc-tree-select-selection__choice-zoom-leave {
	opacity: 1;
}
.rc-tree-select-selection__choice-zoom-leave.rc-tree-select-selection__choice-zoom-leave-active {
	opacity: 0;
}
.rc-tree-select-dropdown-slide-up-enter {
	animation-duration: 0s;
	animation-fill-mode: both;
	transform-origin: 0 0;
	opacity: 0;
	animation-timing-function: cubic-bezier(0.08, 0.82, 0.17, 1);
	animation-play-state: paused;
}
.rc-tree-select-dropdown-slide-up-appear {
	animation-duration: 0s;
	animation-fill-mode: both;
	transform-origin: 0 0;
	opacity: 0;
	animation-timing-function: cubic-bezier(0.08, 0.82, 0.17, 1);
	animation-play-state: paused;
}
.rc-tree-select-dropdown-slide-up-leave {
	animation-duration: 0s;
	animation-fill-mode: both;
	transform-origin: 0 0;
	opacity: 1;
	animation-timing-function: cubic-bezier(0.6, 0.04, 0.98, 0.34);
	animation-play-state: paused;
}
.rc-tree-select-dropdown-slide-up-enter.rc-tree-select-dropdown-slide-up-enter-active.rc-tree-select-dropdown-placement-bottomLeft {
	animation-name: ${rcSelectDropdownSlideUpIn};
	animation-play-state: running;
}
.rc-tree-select-dropdown-slide-up-appear.rc-tree-select-dropdown-slide-up-appear-active.rc-tree-select-dropdown-placement-bottomLeft {
	animation-name:${rcSelectDropdownSlideUpIn};
	animation-play-state: running;
}
.rc-tree-select-dropdown-slide-up-leave.rc-tree-select-dropdown-slide-up-leave-active.rc-tree-select-dropdown-placement-bottomLeft {
	animation-name: ${rcSelectDropdownSlideUpOut};
	animation-play-state: running;
}
.rc-tree-select-dropdown-slide-up-enter.rc-tree-select-dropdown-slide-up-enter-active.rc-tree-select-dropdown-placement-topLeft {
	animation-name:  ${rcSelectDropdownSlideUpIn};
	animation-play-state: running;
}
.rc-tree-select-dropdown-slide-up-appear.rc-tree-select-dropdown-slide-up-appear-active.rc-tree-select-dropdown-placement-topLeft {
	animation-name:  ${rcSelectDropdownSlideUpIn};
	animation-play-state: running;
}
.rc-tree-select-dropdown-slide-up-leave.rc-tree-select-dropdown-slide-up-leave-active.rc-tree-select-dropdown-placement-topLeft {
	animation-name: ${rcSelectDropdownSlideUpOut};
	animation-play-state: running;
}




.tree-select-dropdown.single-tree-select-dropdown {
  .rc-tree-select-tree
	.rc-tree-select-tree-treenode.rc-tree-select-tree-treenode-disabled
	span.rc-tree-select-tree-iconEle {
    cursor: not-allowed;
  }
  .rc-tree-select-tree
	.rc-tree-select-tree-treenode
	span.rc-tree-select-tree-iconEle {
    position: relative;
    cursor: pointer;
    margin-left: 9px;
    top: 0;
    left: 0;
    display: inline-block;
    width: 14px;
    height: 14px;
    direction: ltr;
    background-color: transparent;
    border: 1px solid var(--wds-color-border);
    border-radius: 100%;
    border-collapse: separate;
    transition: none;
    flex-shrink: 0;
  }
}

.tree-select-dropdown {
  min-height: 100px;
  position: absolute;
  background: #fff;
  width: auto;
  border-radius: 0px;
  margin-top: 5px;
  background: white;
  border-radius: ${({ borderRadius }) =>
    borderRadius >= `1.5rem` ? `0.375rem` : borderRadius};
  overflow: hidden;
  box-shadow: 0 6px 20px 0px rgba(0, 0, 0, 0.15) !important;
  &&&& .${Classes.ALIGN_LEFT} {
    font-size: 14px;
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
    background: ${({ accentColor }) => accentColor} !important;
    color: rgb(255, 255, 255);
    border-color: ${({ accentColor }) => accentColor} !important;
    box-shadow: none;
    outline: none !important;
  }
  ${CommonSelectFilterStyle}
  .rc-tree-select-item {
    font-size: 16px;
    line-height: 1.5;
    padding: 5px 16px;
    align-items: center;
    cursor: pointer;
  }
  .rc-tree-select-item-option-state {
    .bp3-control.bp3-checkbox {
      margin-bottom: 0;
    }
  }
}

.rc-tree-select-tree {
	margin: 0;
	border: none;
}
.rc-tree-select-tree-focused:not(.rc-tree-select-tree-active-focused) {
	border-color: cyan;
}
.rc-tree-select-tree .rc-tree-select-tree-treenode {
	margin: 0;
	white-space: nowrap;
	list-style: none;
	outline: 0;
  padding: 0 5px 0 12px;
  height: 38px;
  align-items: center;
  display: flex !important;
}
.rc-tree-select-tree .rc-tree-select-tree-treenode .draggable {
	color: #333;
	-moz-user-select: none;
	-khtml-user-select: none;
	-webkit-user-select: none;
	user-select: none;
	-khtml-user-drag: element;
	-webkit-user-drag: element;
}
.rc-tree-select-tree
	.rc-tree-select-tree-treenode.drop-container
	> .draggable::after {
	position: absolute;
	left: 0;
	right: 0;
	top: 0;
	bottom: 0;
	box-shadow: inset 0 0 0 2px red;
	content: "";
}
.rc-tree-select-tree
	.rc-tree-select-tree-treenode.drop-container
	~ .rc-tree-select-tree-treenode {
	border-left: 2px solid chocolate;
}
.rc-tree-select-tree .rc-tree-select-tree-treenode.drop-target {
	background-color: yellowgreen;
}
.rc-tree-select-tree
	.rc-tree-select-tree-treenode.drop-target
	~ .rc-tree-select-tree-treenode {
	border-left: none;
}
.rc-tree-select-tree
	.rc-tree-select-tree-treenode.filter-node
	> .rc-tree-select-tree-node-content-wrapper {
	color: #182026 !important;
	font-weight: bold !important;
}
.rc-tree-select-tree .rc-tree-select-tree-treenode ul {
	margin: 0;
	padding: 0 0 0 18px;
}
.rc-tree-select-tree
	.rc-tree-select-tree-treenode
	.rc-tree-select-tree-node-content-wrapper {
	position: relative;
	display: inline-flex;
  align-items: center;
	height: 38px;
	margin: 0;
	padding: 0;
	text-decoration: none;
	vertical-align: top;
	cursor: pointer;
  overflow-wrap: break-word;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1 1 0;
}

.rc-tree-select-tree-checkbox-checked .rc-tree-select-tree-checkbox-inner:after {
    position: absolute;
    display: table;
    border: 2px solid #fff;
    border-top: 0;
    border-left: 0;
    transform: rotate(
45deg
) scale(1) translate(-50%,-50%);
    opacity: 1;
    transition: all .2s cubic-bezier(.12,.4,.29,1.46) .1s;
    content: " ";
}
.rc-tree-select-tree-checkbox-inner:after {
    position: absolute;
    top: 50%;
    left: 22%;
    display: table;
    width: 5.71428571px;
    height: 9.14285714px;
    border: 2px solid #fff;
    border-top: 0;
    border-left: 0;
    transform: rotate(
45deg
) scale(0) translate(-50%,-50%);
    opacity: 0;
    transition: all .1s cubic-bezier(.71,-.46,.88,.6),opacity .1s;
    content: " ";
}

.rc-tree-select-tree-checkbox-indeterminate .rc-tree-select-tree-checkbox-inner:after {
  top: 50%;
  left: 50%;
  width: 8px;
  height: 8px;
  background-color: ${({ accentColor }) => accentColor} !important;
  border: 0;
  transform: translate(-50%,-50%) scale(1);
  opacity: 1;
  content: " ";
}

.rc-tree-select-tree-checkbox:hover:after, .rc-tree-select-tree-checkbox-wrapper:hover .rc-tree-select-tree-checkbox:after {
    visibility: visible;
}

.rc-tree-select-tree-checkbox {
    top: initial;
    margin: 4px 8px 0 0;
}
.rc-tree-select-tree-checkbox {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
    color: #000000d9;
    font-size: 14px;
    font-variant: tabular-nums;
    line-height: 1.5715;
    list-style: none;
    font-feature-settings: "tnum";
    position: relative;
    top: 0;
    line-height: 1;
    white-space: nowrap;
    outline: none;
    cursor: pointer;
    margin-left: 3px;
}


.rc-tree-select-tree-checkbox-wrapper:hover .rc-tree-select-tree-checkbox-inner, .rc-tree-select-tree-checkbox:hover .rc-tree-select-tree-checkbox-inner, .rc-tree-select-tree-checkbox-input:focus+.rc-tree-select-tree-checkbox-inner {
  border-color: var(--wds-color-border-hover) !important;
 }
 .rc-tree-select-tree-checkbox-checked .rc-tree-select-tree-checkbox-inner {
   border-color: ${({ accentColor }) => accentColor} !important;
   background: ${({ accentColor }) => accentColor} !important;
 }

.rc-tree-select-tree-checkbox-inner {
    position: relative;
    top: 0;
    left: 0;
    display: inline-block;
    width: 16px;
    height: 16px;
    direction: ltr;
    background-color: #fff;
    border: 1px solid #d9d9d9;
    border-radius: 0px;
    border-collapse: separate;
    transition: all .3s;
}
  .rc-tree-select-tree
  .rc-tree-select-tree-treenode
  span.rc-tree.select-tree-checkbox-checked {
    .rc-tree-select-tree-checkbox-inner {
      border-color: ${({ accentColor }) => accentColor} !important;
      background: ${({ accentColor }) => accentColor} !important;
    }
  }
  .single-tree-select-dropdown
  .rc-tree-select-tree
	.rc-tree-select-tree-treenode
	span.rc-tree-select-tree-iconEle {
    	width: 20px;
  }

.rc-tree-select-tree
	.rc-tree-select-tree-treenode
	span.rc-tree-select-tree-iconEle {
	display: inline-block;
	width: 0px;
	height: 16px;
	line-height: 16px;
	vertical-align: -0.125em;
	background-color: transparent;
	background-image: none;
  background-repeat: no-repeat;
	background-attachment: scroll;
	border: 0 none;
	outline: none;
	cursor: pointer;
}
.rc-tree-select-tree
	.rc-tree-select-tree-treenode
	span.rc-tree-select-tree-switcher {
    height: 38px;
  }
.rc-tree-select-tree
	.rc-tree-select-tree-treenode
	span.rc-tree-select-tree-switcher.rc-tree-select-tree-icon__customize,
.rc-tree-select-tree
	.rc-tree-select-tree-treenode
	span.rc-tree-select-tree-checkbox.rc-tree-select-tree-icon__customize,
.rc-tree-select-tree
	.rc-tree-select-tree-treenode
	span.rc-tree-select-tree-iconEle.rc-tree-select-tree-icon__customize {
	background-image: none;
}
.rc-tree-select-tree
	.rc-tree-select-tree-treenode
	span.rc-tree-select-tree-icon_loading {
	margin-right: 2px;
	vertical-align: top;
	background: none;
}
.rc-tree-select-tree
	.rc-tree-select-tree-treenode
	span.rc-tree-select-tree-switcher.rc-tree-select-tree-switcher-noop {
	cursor: auto;
}
.rc-tree-select-tree
	.rc-tree-select-tree-treenode
	span.rc-tree-select-tree-switcher.rc-tree-select-tree-switcher_open {
	background-position: -93px -56px;
}
.rc-tree-select-tree
	.rc-tree-select-tree-treenode
	span.rc-tree-select-tree-switcher.rc-tree-select-tree-switcher_close {
	background-position: -75px -56px;
}
.rc-tree-select-tree:not(.rc-tree-select-tree-show-line)
	.rc-tree-select-tree-treenode
	.rc-tree-select-tree-switcher-noop {
	background: none;
}
.rc-tree-select-tree.rc-tree-select-tree-show-line
	.rc-tree-select-tree-treenode:not(:last-child)
	> ul {
	background: none;
}
.rc-tree-select-tree.rc-tree-select-tree-show-line
	.rc-tree-select-tree-treenode:not(:last-child)
	> .rc-tree-select-tree-switcher-noop {
	background-position: -56px -18px;
}
.rc-tree-select-tree.rc-tree-select-tree-show-line
	.rc-tree-select-tree-treenode:last-child
	> .rc-tree-select-tree-switcher-noop {
	background-position: -56px -36px;
}
.rc-tree-select-tree-child-tree {
	display: none;
}
.rc-tree-select-tree-child-tree-open {
	display: block;
}
.rc-tree-select-tree-treenode-disabled
	> span:not(.rc-tree-select-tree-switcher),
.rc-tree-select-tree-treenode-disabled > a,
.rc-tree-select-tree-treenode-disabled > a span {
	color: #767676;
	cursor: not-allowed;
}
.rc-tree-select-tree-treenode-selected
{
	background: ${({ accentColor }) => lightenColor(accentColor)};

  &:hover {
    background: ${({ accentColor }) =>
      lightenColor(accentColor, "0.90")} !important;
  }


}
.rc-tree-select-tree-treenode-selected.rc-tree-select-tree-treenode-active {
  background: ${({ accentColor }) =>
    lightenColor(accentColor, "0.90")} !important;
}
.rc-tree-select-tree-treenode-active {
  background: var(--wds-color-bg-focus) !important;
}
.rc-tree-select-tree-treenode:hover {
	background: var(--wds-color-bg-hover);

  .rc-tree-select-tree-iconEle {
    border-color: var(--wds-color-border-hover) !important;
  }
}
.rc-tree-select-tree-node-selected {
	background-color: none;
	box-shadow: 0 0 0 0 #ffb951;
	opacity: 1;

  .rc-tree-select-tree-title {
    color: var(--wds-color-text);
  }

  .rc-tree-select-tree-icon__customize {
    border: none !important;
    background-image: url("data:image/svg+xml,%3Csvg width='14' height='14' viewBox='0 0 14 14' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Crect x='2' y='2' width='10' height='10' rx='5' stroke='${({
      accentColor,
    }) =>
      accentColor?.replace(
        "#",
        "%23",
      )}' stroke-width='4'/%3E%3C/svg%3E%0A") !important;
  }
}
.rc-tree-select-tree-icon__open {
	margin-right: 2px;
	vertical-align: top;
	background-position: -110px -16px;
}
.rc-tree-select-tree-icon__close {
	margin-right: 2px;
	vertical-align: top;
	background-position: -110px 0;
}
.rc-tree-select-tree-icon__docu {
	margin-right: 2px;
	vertical-align: top;
	background-position: -110px -32px;
}
.rc-tree-select-tree-icon__customize {
	margin-right: 2px;
	vertical-align: top;
}
.rc-tree-select-tree-title {
	display: inline-block;
  margin-left: 10px;
  font-size: 14px !important;
  color: var(--wds-color-text);
  overflow: hidden;
  text-overflow: ellipsis;
}
.rc-tree-select-tree-indent {
	display: inline-block;
	vertical-align: bottom;
	height: 0;
}
.rc-tree-select-tree-indent-unit {
	width: 25px;
	display: inline-block;
}

`;

export const TreeSelectContainer = styled.div<{
  allowClear?: boolean;
  compactMode: boolean;
  isValid: boolean;
  labelPosition?: LabelPosition;
  borderRadius: string;
  boxShadow?: string;
  accentColor: string;
}>`
  ${labelLayoutStyles}

  /**
    When the label is on the left it is not center aligned
    here set height to auto and not 100% because the input 
    has fixed height and stretch the container.
  */
    ${({ labelPosition }) => {
      if (labelPosition === LabelPosition.Left) {
        return `
      height: auto !important;
      align-items: stretch;
      `;
      }
    }}

  & .${LABEL_CONTAINER_CLASS} {
    label {
      ${({ labelPosition }) => {
        if (!labelPosition) {
          return `margin-bottom: ${LABEL_MARGIN_OLD_SELECT}`;
        }
      }};
    }
  }

  .rc-tree-select {
    display: inline-block;
    font-size: 12px;
    width: 100%;
    height: 100%;
    position: relative;
    cursor: pointer;

    .rc-tree-select-selection-placeholder {
      pointer-events: none;
      position: absolute;
      top: 50%;
      right: 11px;
      left: 11px;
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
    .rc-tree-select-selection-search-input {
      appearance: none;
      &::-webkit-search-cancel-button {
        display: none;
        appearance: none;
      }
    }
    .rc-tree-select-selection-overflow-item-suffix {
      position: relative !important;
      left: 0px !important;
    }
  }
  && .rc-tree-select-disabled {
    cursor: not-allowed;
    input {
      cursor: not-allowed;
      background-color: var(--wds-color-bg-disabled) !important;
    }
    .rc-tree-select-selector {
      border: 1px solid var(--wds-color-border-disabled) !important;
      background-color: var(--wds-color-bg-disabled) !important;

      .rc-tree-select-selection-search input {
        background-color: var(--wds-color-bg-disabled) // color fix for mozilla
      }
      .rc-tree-select-selection-item {
        color: var(--wds-color-text-disabled);
        background-color: var(--wds-color-bg-disabled) !important;
      }
    }

    .rc-tree-select-selection-placeholder {
      color: var(--wds-color-text-disabled-light);
    }

    & .dropdown-icon {
      svg path {
        fill: var(--wds-color-icon-disabled) !important;
      }
    }
  }
  .rc-tree-select-show-arrow.rc-tree-select-loading {
    .rc-tree-select-arrow-icon {
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
  .rc-tree-select-single {
    &:hover {
      .rc-tree-select-selector {
        border: 1.2px solid
        ${(props) =>
          props.isValid
            ? "var(--wds-color-border-hover)"
            : "var(--wds-color-border-danger-hover)"};
      }
    }
  }
  .rc-tree-select-single .rc-tree-select-selector {
    display: flex;
    flex-wrap: wrap;
    padding-right: 42px;
    border: 1px solid
      ${(props) =>
        props.isValid
          ? "var(--wds-color-border)"
          : "var(--wds-color-border-danger)"};
    box-sizing: border-box;
    background: var(--wds-color-bg);
    border-radius: ${({ borderRadius }) => borderRadius};
    box-shadow: ${({ boxShadow }) => `${boxShadow}`} !important;
    overflow: hidden;
    width: 100%;
    transition: none;
    height: 100%;

    .rc-tree-select-selection-search {
      width: 100%;
      height: 100%;
      input {
        background: ${Colors.WHITE};
        width: 100%;
        appearance: none;
        &::-webkit-search-cancel-button {
          display: none;
          appearance: none;
        }
        font-family: system-ui;

        height: 100%;
        min-height: 30px;
        border: none;
      }
    }
    .rc-tree-select-selection-item {
      position: absolute;
      top: 50%;
      right: 11px;
      left: 11px;
      transform: translateY(-50%);
      transition: all 0.3s;
      flex: 1;
      overflow: hidden;
      color: #231f20;
      white-space: nowrap;
      text-overflow: ellipsis;
      font-size: 14px;
      ${(props) =>
        props.allowClear
          ? `width: calc(100% - 58px)`
          : `width: calc(100% - 40px)`}
    }
  }
  .rc-tree-select-multiple {
    .rc-tree-select-selector {
      padding-right: 20px;
      display: flex;
      flex-wrap: wrap;
      padding: 1px;
      box-shadow: none;
      border: 1px solid rgb(231, 231, 231);
      background: ${Colors.WHITE};
      border-radius: ${({ borderRadius }) => borderRadius};
      box-shadow: ${({ boxShadow }) => `${boxShadow}`} !important;
      width: 100%;
      transition: none;
      background-color: white;
      .rc-tree-select-selection-item {
        background: none;
        border: 1px solid rgb(208, 215, 221);
        border-radius: ${({ borderRadius }) => borderRadius};
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
      .rc-tree-select-selection-item-disabled {
        cursor: not-allowed;
        opacity: 0.5;
      }
      .rc-tree-select-selection-overflow {
        display: flex;
        width: 100%;
        align-content: center;
      }
      .rc-tree-select-selection-overflow-item {
        flex: none;
        max-width: 100%;
      }
      .rc-tree-select-selection-search {
        position: relative;
        max-width: 100%;
        margin-bottom: 2px;
        height: 100%;
        display: flex;
        align-items: center;
      }
      .rc-tree-select-selection-search-input {
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
        color: ${Colors.GREY_10};
      }
      .rc-tree-select-selection-search-mirror {
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
  .rc-tree-select-selection-item-content {
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
  .rc-tree-select-allow-clear {
    .rc-tree-select-clear {
      position: absolute;
      right: 28px;
      top: 0px;
      height: 100%;
      display: flex;
      align-items: center;
      .rc-tree-select-clear-icon {
        font-size: 18px;
        font-weight: bold;
      }
    }
  }

  .rc-tree-select-show-arrow.rc-tree-select-multiple {
    .rc-tree-select-selector {
      padding-right: 20px;
      box-shadow: none;
      border: 1px solid rgb(231, 231, 231);
      border-radius: 0px;
      height: inherit;
      width: 100%;
      transition: none;
    }
  }
  && .rc-tree-select-show-arrow.rc-tree-select-focused {
    .rc-tree-select-selector {
      outline: 0px;
      ${(props) =>
        props.isValid
          ? `
          border: 1px solid ${props.accentColor};
          box-shadow: 0px 0px 0px 3px ${lightenColor(
            props.isValid ? props.accentColor : Colors.DANGER_SOLID,
          )} !important;`
          : `border: 1px solid ${Colors.DANGER_SOLID};`}
    }
  }
  .rc-tree-select-show-arrow {
    .rc-tree-select-clear {
      top: 0;

      & .clear-icon {
        width: 16px;
        margin-right: 8px;

        svg {
          width: 16px;
          height: 16px;

          fill: var(--wds-color-icon);

          path {
            fill: var(--wds-color-icon);
          }
        }
      }
    }
    .rc-tree-select-arrow {
      pointer-events: none;
      position: absolute;
      right: 0;
      top: 0;
      height: 100%;
      width: 38px;
      display: flex;
      align-items: center;
      justify-content: center;
      & .dropdown-icon {
        width: 20px;
        svg {
          width: 20px;
          height: 20px;
          path {
            fill: var(--wds-color-icon);
          }
        }
      fill: var(--wds-color-icon);
      }
    }
    .rc-tree-select-arrow-icon {
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
    .rc-tree-select-show-arrow.rc-tree-select-focused {
      .rc-tree-select-selector {
        outline: 0px;
        ${(props) =>
          props.isValid
            ? `
            border: 1px solid ${props.accentColor};
            box-shadow: 0px 0px 0px 2px ${props.accentColor};`
            : `border: 1px solid ${Colors.DANGER_SOLID};`}
      }
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

export const InputContainer = styled.div<{
  compactMode: boolean;
  labelPosition?: LabelPosition;
}>`
  width: 100%;
  height: 100%;

  &,
  & .rc-tree-select {
    ${({ labelPosition }) =>
      labelPosition && `height: ${SELECT_DEFAULT_HEIGHT}`};
  }
`;
