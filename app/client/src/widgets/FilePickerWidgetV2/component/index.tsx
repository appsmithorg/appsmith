import React from "react";
import type { ComponentProps } from "widgets/BaseComponent";
import { BaseButton } from "widgets/ButtonWidget/component";
import { Colors } from "constants/Colors";

function FilePickerComponent(props: FilePickerComponentProps) {
  let computedLabel = props.label;

  if (props.files && props.files.length) {
    computedLabel = `${props.files.length} files selected`;
  }

  return (
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
  );
}
export interface FilePickerComponentProps extends ComponentProps {
  label: string;
  openModal: () => void;
  isLoading: boolean;
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
