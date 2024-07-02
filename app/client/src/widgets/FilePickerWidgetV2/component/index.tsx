import React from "react";
import type { ComponentProps } from "widgets/BaseComponent";
import {
  BaseButton,
  ToolTipWrapper,
  TooltipStyles,
} from "widgets/ButtonWidget/component";
import { Colors } from "constants/Colors";
import { Popover2 } from "@blueprintjs/popover2";
import { Position } from "@blueprintjs/core";

function FilePickerComponent(props: FilePickerComponentProps) {
  let computedLabel = props.label;

  if (props.files && props.files.length) {
    computedLabel = `${props.files.length} files selected`;
  }

  return (
    <ToolTipWrapper>
      <TooltipStyles />
      <Popover2
        content={computedLabel}
        hoverOpenDelay={200}
        interactionKind="hover"
        portalClassName="btnTooltipContainer"
        position={Position.TOP}
      >
        <BaseButton
          borderRadius={props.borderRadius}
          boxShadow={props.boxShadow}
          buttonColor={props.buttonColor}
          disabled={props.isDisabled}
          loading={props.isLoading}
          maxWidth={props.maxWidth}
          minHeight={props.minHeight}
          minWidth={props.minWidth}
          onClick={props.openModal}
          shouldFitContent={props.shouldFitContent}
          text={computedLabel}
        />
      </Popover2>
    </ToolTipWrapper>
  );
}
export interface FilePickerComponentProps extends ComponentProps {
  label: string;
  openModal: () => void;
  isLoading: boolean;
  files?: any[];
  buttonColor: string;
  borderRadius: string;
  boxShadow?: string;
  shouldFitContent: boolean;
  maxWidth?: number;
  minWidth?: number;
  minHeight?: number;
}

FilePickerComponent.defaultProps = {
  backgroundColor: Colors.GREEN,
};

export default FilePickerComponent;
