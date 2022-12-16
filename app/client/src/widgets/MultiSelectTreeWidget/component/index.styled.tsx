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
import {
  Icon,
  labelLayoutStyles,
  LABEL_CONTAINER_CLASS,
  multiSelectInputContainerStyles,
} from "design-system";
import { lightenColor } from "widgets/WidgetUtils";
import CheckIcon from "assets/icons/widget/checkbox/check-icon.svg";

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
  .multiselecttree-popover-width-${id} {
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
  border-radius: ${({ borderRadius }) =>
    borderRadius >= `1.5rem` ? `0.375rem` : borderRadius};
  overflow: hidden;
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
      border-radius: ${({ borderRadius }) => borderRadius};
      &::before {
        width: auto;
        height: 1em;
      }
    }
    .${Classes.CONTROL} input:checked ~ .${Classes.CONTROL_INDICATOR} {
      background: ${({ accentColor }) => `${accentColor}`} !important;
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
.rc-tree-select-tree-list-holder-inner {
  overflow: hidden;
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
  overflow-wrap: break-word;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1 1 0;
}

.rc-tree-select-tree-checkbox-indeterminate .rc-tree-select-tree-checkbox-inner {
  border: none !important;
  background-color: ${({ accentColor }) => accentColor};

  &:after {
    content: "";
    height: 1px;
    width: 8px;
    top: 7px;
    left: 3px;
    right: 3px;
    background-color: ${Colors.WHITE} !important;
    position: absolute;
    transform: unset;
  }
}

.rc-tree-select-tree-checkbox:hover:after, .rc-tree-select-tree-checkbox-wrapper:hover .rc-tree-select-tree-checkbox:after {
    visibility: visible;
}

.rc-tree-select-tree-checkbox {
  box-sizing: border-box;
  margin: 0 0px 0 9px;
  white-space: nowrap;
  outline: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  height: 100%;
}


.rc-tree-select-tree-checkbox-checked .rc-tree-select-tree-checkbox-inner {
  border: none !important;
  background-color: ${({ accentColor }) => accentColor};
  background-image: url(${CheckIcon}) !important;
  background-repeat: no-repeat !important;
  background-position: center !important;
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
    transition: none;
    border-radius: ${({ borderRadius }) => borderRadius};
}
  .rc-tree-select-tree
  .rc-tree-select-tree-treenode
  span.rc-tree.select-tree-checkbox-checked {
    .rc-tree-select-tree-checkbox-inner {
      border-color:${({ accentColor }) => accentColor} !important;
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
	margin-right: 0px;
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
	margin-right: 0px;
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
	background: var(--wds-color-bg-focus) !important;

  :not(.rc-tree-select-tree-treenode-checkbox-checked) .rc-tree-select-tree-checkbox-inner {
    background: transparent;
    border-color: var(--wds-color-border-hover);
  }
}
.rc-tree-select-tree-treenode:hover {
  &.rc-tree-select-tree-treenode-checkbox-checked {
    background: ${({ accentColor }) =>
      lightenColor(accentColor, "0.90")} !important;
  }
	background: var(--wds-color-bg-hover);
  .rc-tree-select-tree-title {
    color: var(--wds-color-text);
  }
  .rc-tree-select-tree-checkbox-indeterminate .rc-tree-select-tree-checkbox-inner {
    background-color: ${({ accentColor }) => accentColor} !important;
  }
  :not(.rc-tree-select-tree-treenode-checkbox-checked) .rc-tree-select-tree-checkbox-inner {
    background: transparent;
    border-color: var(--wds-color-border-hover);
  }
}
.rc-tree-select-tree-treenode-checkbox-checked {
  background: ${({ accentColor }) => lightenColor(accentColor)};
  .rc-tree-select-tree-title {
    color: var(--wds-color-text);
  }
}
.rc-tree-select-tree-icon__open {
	margin-right: 0px;
	vertical-align: top;
	background-position: -110px -16px;
}
.rc-tree-select-tree-icon__close {
	margin-right: 0px;
	vertical-align: top;
	background-position: -110px 0;
}
.rc-tree-select-tree-icon__docu {
	margin-right: 2px;
	vertical-align: top;
	background-position: -110px -32px;
}
.rc-tree-select-tree-icon__customize {
	margin-right: 0px;
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

  }
`;

export const TreeSelectContainer = styled.div<{
  compactMode: boolean;
  allowClear: boolean;
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

    ${({ compactMode, labelPosition }) =>
      labelPosition !== LabelPosition.Top && compactMode && `height: 100%;`};

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
      color: var(--wds-color-text-light);
      white-space: nowrap;
      text-overflow: ellipsis;
      pointer-events: none;
      font-size: 14px;
      margin-left: -8px;
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
      .rc-tree-select-selection-item-content {
        color: var(--wds-color-text-disabled);
      }
    }
    .rc-tree-select-selection-placeholder {
      color: var(--wds-color-text-disabled-light);
    }
    .rc-tree-select-arrow .dropdown-icon
      svg {
        path {
          fill: var(--wds-color-icon-disabled);
        }
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
        border: 1px solid var(--wds-color-border-hover);
      }
    }
  }
  .rc-tree-select-single .rc-tree-select-selector {
    display: flex;
    flex-wrap: wrap;
    padding-right: 42px;
    background: ${Colors.WHITE};
    border-radius: ${({ borderRadius }) => borderRadius};
    box-shadow: ${({ boxShadow }) => `${boxShadow}`} !important;
    border: 1px solid var(--wds-color-border);
    box-sizing: border-box;
    width: 100%;
    transition: none;
    background-color: var(--wds-color-bg);
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
      background: var(--wds-color-bg);
    border-radius: ${({ borderRadius }) => borderRadius};
    box-shadow: ${({ boxShadow }) => `${boxShadow}`} !important;
      width: 100%;
      transition: none;
      .rc-tree-select-selection-item {
        background: none;
        border: 1px solid var(--wds-color-border);
        border-radius:${({ borderRadius }) => borderRadius};
        max-width: 273.926px;
        height: 20px;
        color: var(--wds-color-text);
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
      .rc-tree-select-clear-icon {
        font-size: 18px;
        font-weight: bold;


      }
    }
  }

  .rc-tree-select-show-arrow.rc-tree-select-multiple {
    .rc-tree-select-selector {
      padding-right: ${({ allowClear }) => (allowClear ? "40px" : "20px")};
      padding-left: 10px;
      background: var(--wds-color-bg);
    border-radius: ${({ borderRadius }) => borderRadius};
    box-shadow: ${({ boxShadow }) => `${boxShadow}`} !important;
      height: inherit;
      width: 100%;
      line-height: 30px;
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
  && .rc-tree-select-show-arrow.rc-tree-select-focused {
    .rc-tree-select-selector {
      outline: 0px;
      ${(props) =>
        props.isValid
          ? `
      border: 1px solid  ${props.accentColor};
      box-shadow: 0px 0px 0px 3px ${lightenColor(
        props.accentColor,
      )} !important;`
          : `border: 1.2px solid ${Colors.DANGER_SOLID};`}
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
  }
`;

export const StyledCheckbox = styled(Checkbox)`
  &&&.${Classes.CHECKBOX}.${Classes.CONTROL} {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    height: 38px;
    padding-bottom: 0;
    color: ${Colors.GREY_8};
    display: flex;
    align-items: center;
    &:hover {
      background: ${Colors.GREEN_SOLID_LIGHT_HOVER};
      color: ${Colors.GREY_9};
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
