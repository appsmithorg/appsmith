import * as React from "react";
import { ComponentProps } from "components/designSystems/appsmith/BaseComponent";
import "@uppy/core/dist/style.css";
import "@uppy/dashboard/dist/style.css";
import "@uppy/webcam/dist/style.css";
import { BaseButton } from "components/designSystems/blueprint/ButtonComponent";
import { DashboardModal } from "@uppy/react";

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
    this.setState({ isOpen: true });
  };

  render() {
    return (
      <React.Fragment>
        <BaseButton text={"Upload files"} onClick={this.openModal} />
        <DashboardModal
          open={this.state.isOpen}
          target={document.body}
          closeModalOnClickOutside={true}
          plugins={["GoogleDrive", "Url", "OneDrive", "Webcam"]}
          onRequestClose={() => this.setState({ isOpen: false })}
          uppy={this.props.uppy}
        />
      </React.Fragment>
    );
  }
}

export interface FilePickerComponentState {
  isOpen: boolean;
}

export interface FilePickerComponentProps extends ComponentProps {
  label: string;
  uppy: any;
}

export default FilePickerComponent;
