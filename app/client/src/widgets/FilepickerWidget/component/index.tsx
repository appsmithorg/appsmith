import * as React from "react";
import { ComponentProps } from "widgets/BaseComponent";
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
      this.props.uppy.getPlugin("Dashboard").openModal();
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
    this.props.uppy.getPlugin("Dashboard").closeModal();
  }
}

export interface FilePickerComponentState {
  isOpen: boolean;
}

export interface FilePickerComponentProps extends ComponentProps {
  label: string;
  uppy: any;
  isLoading: boolean;
  files?: any[];
}

export default FilePickerComponent;
