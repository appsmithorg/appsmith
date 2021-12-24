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
import Icon from "components/ads/Icon";

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
  disabled?: boolean;
}>`
  overflow-y: hidden;
  text-overflow: ellipsis;
  width: ${(props) => (props.$compactMode ? "auto" : "100%")};
  text-align: left;
  color: ${(props) =>
    props.disabled ? Colors.GREY_8 : props.$labelTextColor || "inherit"};
  font-size: ${(props) =>
    props.$labelTextSize ? TEXT_SIZES[props.$labelTextSize] : "14px"};
  font-weight: ${(props) =>
    props?.$labelStyle?.includes(FontStyleTypes.BOLD) ? "bold" : "normal"};
  font-style: ${(props) =>
    props?.$labelStyle?.includes(FontStyleTypes.ITALIC) ? "italic" : ""};
`;

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
  .multiselecttree-popover-width-${id} {
    min-width: ${
      parentWidth > dropDownWidth ? parentWidth : dropDownWidth
    }px !important;
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
.rc-tree-select-empty {
  color: rgba(92, 112, 128, 0.6) !important
}
.tree-select-dropdown.rc-tree-select-dropdown-empty {
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




.tree-multiselect-dropdown.single-tree-select-dropdown {
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
      margin-left: 5px;
      top: 0;
      left: 0;
      display: inline-block;
      width: 16px;
      height: 16px;
      direction: ltr;
      background-color: #fff;
border: 1px solid #E8E8E8;
      border-radius: 100%;
      border-collapse: separate;
      transition: all .3s;
      :after{
          position: absolute;
        top: 50%;
       left: 52%;
        display: table;
        width: 10px;
        height: 10px;
        border: none;
        border-top: 0;
        border-left: 0;
        transform: rotate(
        45deg
        ) scale(0) translate(-50%,-50%);
        opacity: 0;
        transition: all .1s cubic-bezier(.71,-.46,.88,.6),opacity .1s;
        content: " ";
      }

  }

  .rc-tree-select-tree
	.rc-tree-select-tree-treenode
  .rc-tree-select-tree-node-selected
	span.rc-tree-select-tree-iconEle {
    :after{
        width: 10px;
        height: 10px;
      transform: translate(-50%,-50%) scale(1);
       background: rgb(3, 179, 101) !important;
       opacity: 1;
    content: " ";
        border-radius: 100%;
    
    }
  }

}
.tree-multiselect-dropdown {
  min-height: 100px;
  position: absolute;
  background: #fff;
  width: 100%;
  border-radius: 0px;
  margin-top: 5px;
  background: white;
  box-shadow: 0 6px 20px 0px rgba(0, 0, 0, 0.15) !important;
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

.rc-tree-select-tree-focused:not(.rc-tree-select-tree-active-focused) {
	border-color: cyan;
}
.rc-tree-select-tree .rc-tree-select-tree-treenode {
	margin: 0;
  padding: 0 5px 0 12px;
  line-height: 24px;
  height: 38px;
	white-space: nowrap;
	list-style: none;
	outline: 0;
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
	height: 34px;
	margin: 0;
	padding: 0;
	text-decoration: none;
	vertical-align: top;
	cursor: pointer;
  flex: 1
}

.rc-tree-select-tree-checkbox-indeterminate .rc-tree-select-tree-checkbox-inner {
  border: none !important;
  background-color: ${Colors.GREEN_SOLID};

  &:after {
    content: "";
    height: 1px;
    width: 8px;
    top: 7px;
    left: 3px;
    right: 3px;
    background-color: ${Colors.WHITE};
    position: absolute;
  }
}

.rc-tree-select-tree-checkbox:hover:after, .rc-tree-select-tree-checkbox-wrapper:hover .rc-tree-select-tree-checkbox:after {
    visibility: visible;
}

.rc-tree-select-tree-checkbox {
  box-sizing: border-box;
  margin: 0 2px 0 9px;
  white-space: nowrap;
  outline: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  height: 100%;
}


.rc-tree-select-tree-checkbox-checked .rc-tree-select-tree-checkbox-inner {
  border: none !important;
  background: url("data:image/svg+xml,%3Csvg width='14' height='14' viewBox='0 0 14 14' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Crect width='14' height='14' fill='%2350AF6C'/%3E%3Cpath d='M10.1039 3.5L11 4.40822L5.48269 10L2.5 6.97705L3.39613 6.06883L5.48269 8.18305L10.1039 3.5Z' fill='white'/%3E%3C/svg%3E%0A");
}

.rc-tree-select-tree-checkbox-inner {
    position: relative;
    top: 0;
    left: 0;
    display: inline-block;
    width: 14px;
    height: 14px;
    direction: ltr;
    border: 1px solid ${Colors.GREY_3};
    border-radius: 0px;
    border-collapse: separate;
    transition: all .1s;
}
  .rc-tree-select-tree
	.rc-tree-select-tree-treenode
	span.rc-tree.select-tree-checkbox-checked {
    .rc-tree-select-tree-checkbox-inner {
      border-color: rgb(3, 179, 101) !important;
      background: rgb(3, 179, 101) !important;
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
	margin-right: 2px;
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
  height: 38px;
}
.rc-tree-select-tree
	.rc-tree-select-tree-treenode > span {
  height: 38px;
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
.rc-tree-select-tree-treenode-active {
	background: ${Colors.GREEN_SOLID_LIGHT_HOVER};
}
.rc-tree-select-tree-treenode:hover {
	background: ${Colors.GREEN_SOLID_LIGHT_HOVER};
  .rc-tree-select-tree-title {
    color: ${Colors.GREY_9};
  }
  .rc-tree-select-tree-checkbox-inner {
    background-color: transparent;
  }
}
.rc-tree-select-tree-treenode-checkbox-checked {
	background: ${Colors.GREEN_SOLID_LIGHT_HOVER};
  .rc-tree-select-tree-title {
    color: ${Colors.GREY_10};
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
  color: ${Colors.GREY_8};
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

  }
`;

export const TreeSelectContainer = styled.div<{
  compactMode: boolean;
  allowClear: boolean;
  isValid: boolean;
}>`
  display: flex;
  flex-direction: ${(props) => (props.compactMode ? "row" : "column")};
  align-items: ${(props) => (props.compactMode ? "center" : "left")};

  label.tree-select-label {
    margin-bottom: ${(props) => (props.compactMode ? "0px" : "5px")};
    margin-right: ${(props) => (props.compactMode ? "10px" : "0px")};
  }
  .rc-tree-select {
    display: inline-block;
    font-size: 12px;
    width: 100%;
    height: 100%;
    position: relative;
    cursor: pointer;
    flex: 1 1;
    .rc-tree-select-selection-placeholder {
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
      background-color: ${Colors.GREY_1} !important;
    }
    .rc-tree-select-selector {
      border: 1.2px solid ${Colors.GREY_3} !important;
      background-color: ${Colors.GREY_1} !important;
      .rc-tree-select-selection-item-content {
        color: ${Colors.GREY_7};
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
        border: 1.2px solid ${Colors.GREY_5};
      }
    }
  }
  .rc-tree-select-single .rc-tree-select-selector {
    display: flex;
    flex-wrap: wrap;
    padding-right: 42px;
    box-shadow: none;
    border: 1.2px solid ${Colors.GREY_3};
    box-sizing: border-box;
    border-radius: 0px;
    width: 100%;
    transition: border-color 0.15s ease-in-out 0s,
      box-shadow 0.15s ease-in-out 0s;
    background-color: white;
    height: 100%;
    .rc-tree-select-selection-search {
      width: 100%;
      height: 100%;
      input {
        width: 100%;
        appearance: none;
        &::-webkit-search-cancel-button {
          display: none;
          appearance: none;
        }
        font-family: system-ui;

        height: 100%;
        border: none;
      }
    }
    .rc-tree-select-selection-item {
      pointer-events: none;
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
      pointer-events: none;
      font-size: 14px;
    }
  }
  .rc-tree-select-multiple {
    .rc-tree-select-selector {
      display: flex;
      flex-wrap: wrap;
      box-shadow: none;
      border-radius: 0px;
      width: 100%;
      transition: border-color 0.15s ease-in-out 0s,
        box-shadow 0.15s ease-in-out 0s;
      background-color: white;
      .rc-tree-select-selection-item {
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
      .rc-tree-select-selection-item-disabled {
        cursor: not-allowed;
        opacity: 0.5;
      }
      .rc-tree-select-selection-overflow {
        display: flex;
        flex-wrap: wrap;
        width: 100%;
        align-items: center;
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
    margin: 0 4px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    word-wrap: normal;
    font-size: 12px;
    line-height: 18px;
  }
  .rc-tree-select-selection-item-remove {
    width: 20px;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    &:hover {
      background-color: ${Colors.GREY_2};
    }
  }
  .rc-tree-select-allow-clear {
    .rc-tree-select-clear {
      position: absolute;
      right: 28px;
      top: 0px;
      height: 100%;
      display: flex;
      align-items: center;
      z-index: -1;
      .rc-tree-select-clear-icon {
        font-size: 18px;
        font-weight: bold;
      }
    }
  }
  .rc-tree-select-allow-clear.rc-tree-select-focused {
    .rc-tree-select-clear {
      z-index: 1;
    }
  }
  .rc-tree-select-show-arrow.rc-tree-select-multiple {
    .rc-tree-select-selector {
      padding-right: ${({ allowClear }) => (allowClear ? "40px" : "20px")};
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
          ${(props) => (props.isValid ? Colors.GREY_5 : Colors.DANGER_SOLID)};
      }
    }
  }
  .rc-tree-select-show-arrow {
    .rc-tree-select-clear {
      top: 0;

      & .clear-icon {
        width: 16px;
        svg {
          width: 16px;
          height: 16px;
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
        }
      fill: ${Colors.SLATE_GRAY};
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
  }
  .rc-tree-select-show-arrow.rc-tree-select-focused {
    .rc-tree-select-selector {
      outline: 0px;
      ${(props) =>
        props.isValid
          ? `
          border: 1.2px solid ${Colors.GREEN_SOLID} !important;
          box-shadow: 0px 0px 0px 2px ${Colors.GREEN_SOLID_HOVER};`
          : `border: 1.2px solid ${Colors.DANGER_SOLID};`}
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
