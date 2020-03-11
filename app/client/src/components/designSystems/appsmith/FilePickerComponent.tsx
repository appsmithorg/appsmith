import * as React from "react";
import { ComponentProps } from "components/designSystems/appsmith/BaseComponent";
import "@uppy/core/dist/style.css";
import "@uppy/dashboard/dist/style.css";
import "@uppy/webcam/dist/style.css";
import { BaseButton } from "components/designSystems/blueprint/ButtonComponent";
// import { DashboardModal } from "@uppy/react";

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
    // this.setState({ isOpen: true });
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
          className={this.props.isLoading ? "bp3-skeleton" : ""}
          text={label}
          onClick={this.openModal}
        />
        {/* <DashboardModal
          open={this.state.isOpen}
          closeModalOnClickOutside={true}
          // plugins={["GoogleDrive", "Url", "OneDrive", "Webcam"]}
          onRequestClose={this.closeModal}
          uppy={this.props.uppy}
        /> */}
      </React.Fragment>
    );
  }

  public closeModal() {
    // this.setState({ isOpen: false });
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
