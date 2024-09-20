import * as React from "react";
import type { ComponentProps } from "widgets/BaseComponent";
import "@uppy/core/dist/style.css";
import "@uppy/dashboard/dist/style.css";
import "@uppy/webcam/dist/style.css";
import { BaseButton } from "widgets/ButtonWidget/component";
import { Colors } from "constants/Colors";

class FilePickerComponent extends React.Component<
  FilePickerComponentProps,
  FilePickerComponentState
> {
  constructor(props: FilePickerComponentProps) {
    super(props);
    this.state = {
      isOpen: false,
    };
  }

  openModal = () => {
    if (!this.props.isDisabled) {
      this.props.openModal();
    }
  };

  render() {
    let label = this.props.label;

    if (this.props.files && this.props.files.length) {
      label = `${this.props.files.length} files selected`;
    }

    return (
      <BaseButton
        buttonColor={Colors.GREEN}
        disabled={this.props.isDisabled}
        loading={this.props.isLoading}
        onClick={this.openModal}
        text={label}
      />
    );
  }

  public closeModal() {
    this.props.closeModal();
  }
}

export interface FilePickerComponentState {
  isOpen: boolean;
}

export interface FilePickerComponentProps extends ComponentProps {
  label: string;
  openModal: () => void;
  closeModal: () => void;
  isLoading: boolean;
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  files?: any[];
}

export default FilePickerComponent;
