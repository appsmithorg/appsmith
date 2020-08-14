import * as React from "react";
import { ComponentProps } from "components/designSystems/appsmith/BaseComponent";
import "@uppy/core/dist/style.css";
import "@uppy/dashboard/dist/style.css";
import "@uppy/webcam/dist/style.css";
import { BaseButton } from "components/designSystems/blueprint/ButtonComponent";

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
    this.props.uppy.getPlugin("Dashboard").openModal();
  };

  render() {
    let label = this.props.label;
    if (this.props.files && this.props.files.length) {
      label = `${this.props.files.length} files selected`;
    }
    return (
      <React.Fragment>
        <BaseButton
          accent="primary"
          filled
          loading={this.props.isLoading}
          text={label}
          onClick={this.openModal}
          disabled={this.props.isDisabled}
        />
      </React.Fragment>
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
