import React from "react";
import { Checkbox, Classes } from "@blueprintjs/core";
import styled, { keyframes } from "styled-components";
import { Colors } from "constants/Colors";
import { createGlobalStyle } from "constants/DefaultTheme";

export const menuItemSelectedIcon = (props: { isSelected: boolean }) => {
  return <StyledCheckbox checked={props.isSelected} />;
};

export const StyledText = styled.p`
  overflow-y: hidden;
  text-overflow: ellipsis;
  width: 100%;
  text-align: left;
  font-weight: normal;
  font-size: 14px;
  margin-bottom: 5px;
`;

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
.rc-tree-select-selection__choice-zoom {
	transition: all 0.3s;
}
.rc-tree-select-selection__choice-zoom-appear {
	opacity: 0;
	transform: scale(0.5);
}
.rc-tree-select-selection__choice-zoom-appear.rc-tree-select-selection__choice-zoom-appear-active {
	opacity: 1;
	transform: scale(1);
}
.rc-tree-select-selection__choice-zoom-leave {
	opacity: 1;
	transform: scale(1);
}
.rc-tree-select-selection__choice-zoom-leave.rc-tree-select-selection__choice-zoom-leave-active {
	opacity: 0;
	transform: scale(0.5);
}
.rc-tree-select-dropdown-slide-up-enter {
	animation-duration: 0.3s;
	animation-fill-mode: both;
	transform-origin: 0 0;
	opacity: 0;
	animation-timing-function: cubic-bezier(0.08, 0.82, 0.17, 1);
	animation-play-state: paused;
}
.rc-tree-select-dropdown-slide-up-appear {
	animation-duration: 0.3s;
	animation-fill-mode: both;
	transform-origin: 0 0;
	opacity: 0;
	animation-timing-function: cubic-bezier(0.08, 0.82, 0.17, 1);
	animation-play-state: paused;
}
.rc-tree-select-dropdown-slide-up-leave {
	animation-duration: 0.3s;
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
  .tree-select-dropdown {
    min-height: 100px;
    min-width: 250px !important;
	position: absolute;
	background: #fff;
	width: 100%;
	border-radius: 0px;
	margin-top: 10px;
	padding: 12px;
	background: white;
	box-shadow: 0px 6px 20px rgba(0, 0, 0, 0.15) !important;
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



.rc-tree-select-tree {
	margin: 0;
	border: 1px solid transparent;
}
.rc-tree-select-tree-focused:not(.rc-tree-select-tree-active-focused) {
	border-color: cyan;
}
.rc-tree-select-tree .rc-tree-select-tree-treenode {
	margin: 0;
	padding: 0;
	line-height: 24px;
	white-space: nowrap;
	list-style: none;
	outline: 0;
  padding: 0 5px;
  height: 34px;
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
	color: #a60000 !important;
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
    background-color: rgb(3, 179, 101) !important;
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
 border-color: rgb(3, 179, 101) !important;
}
.rc-tree-select-tree-checkbox-checked .rc-tree-select-tree-checkbox-inner {

 border-color: rgb(3, 179, 101) !important;

          background: rgb(3, 179, 101) !important;
   
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
    border-radius: 2px;
    border-collapse: separate;
    transition: all .3s;
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
	background-image: url("data:image/png;base64,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");
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
	background: url("data:image/gif;base64,R0lGODlhEAAQAKIGAMLY8YSx5HOm4Mjc88/g9Ofw+v///wAAACH/C05FVFNDQVBFMi4wAwEAAAAh+QQFCgAGACwAAAAAEAAQAAADMGi6RbUwGjKIXCAA016PgRBElAVlG/RdLOO0X9nK61W39qvqiwz5Ls/rRqrggsdkAgAh+QQFCgAGACwCAAAABwAFAAADD2hqELAmiFBIYY4MAutdCQAh+QQFCgAGACwGAAAABwAFAAADD1hU1kaDOKMYCGAGEeYFCQAh+QQFCgAGACwKAAIABQAHAAADEFhUZjSkKdZqBQG0IELDQAIAIfkEBQoABgAsCgAGAAUABwAAAxBoVlRKgyjmlAIBqCDCzUoCACH5BAUKAAYALAYACgAHAAUAAAMPaGpFtYYMAgJgLogA610JACH5BAUKAAYALAIACgAHAAUAAAMPCAHWFiI4o1ghZZJB5i0JACH5BAUKAAYALAAABgAFAAcAAAMQCAFmIaEp1motpDQySMNFAgA7")
		no-repeat scroll 0 0 transparent;
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
	background: url("data:image/gif;base64,R0lGODlhCQACAIAAAMzMzP///yH5BAEAAAEALAAAAAAJAAIAAAIEjI9pUAA7")
		0 0 repeat-y;
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
	    background: rgb(233, 250, 243);
}
.rc-tree-select-tree-treenode:hover {
	    background: rgb(233, 250, 243);
}
.rc-tree-select-tree-node-selected {
	background-color: none;
	box-shadow: 0 0 0 0 #ffb951;
	opacity: 1;
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
  font-size: 16px !important;
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

export const TreeSelectContainer = styled.div`
  display: flex;
  flex-direction: column;

  .rc-tree-select {
    display: inline-block;
    font-size: 12px;
    width: 100%;
    height: 100%;
    position: relative;
    cursor: pointer;
    flex: 1;
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
      color: #bfbfbf;
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
  }
  .rc-tree-select-disabled {
    cursor: not-allowed;
    input {
      cursor: not-allowed;
    }
    .rc-tree-select-selector {
      opacity: 0.3;
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
  .rc-tree-select-single .rc-tree-select-selector {
    display: flex;
    flex-wrap: wrap;
    padding: 1px;
    padding-right: 20px;
    box-shadow: none;
    border: 1px solid rgb(231, 231, 231);
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
      .rc-tree-select-selection-item {
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
      .rc-tree-select-selection-item-disabled {
        cursor: not-allowed;
        opacity: 0.5;
      }
      .rc-tree-select-selection-overflow {
        display: flex;
        flex-wrap: wrap;
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
        -webkit-margin-start: 7px;
        margin-inline-start: 5px;
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
      right: 20px;
      top: 0;
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
      transition: border-color 0.15s ease-in-out 0s,
        box-shadow 0.15s ease-in-out 0s;
    }
  }
  .rc-tree-select-show-arrow {
    .rc-tree-select-arrow {
      pointer-events: none;
      position: absolute;
      right: 5px;
      top: 0;
      height: 100%;
      display: flex;
      align-items: center;
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
