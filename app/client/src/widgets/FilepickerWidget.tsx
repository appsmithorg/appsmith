import * as React from "react";
import BaseWidget, { WidgetProps, WidgetState } from "./BaseWidget";
import { WidgetType } from "../constants/WidgetConstants";
import FilePickerComponent from "../components/appsmith/FilePickerComponent";
import Uppy from "@uppy/core";
import GoogleDrive from "@uppy/google-drive";
import Webcam from "@uppy/webcam";
import Url from "@uppy/url";
import OneDrive from "@uppy/onedrive";

class FilePickerWidget extends BaseWidget<FilePickerWidgetProps, WidgetState> {
  uppy: any;

  constructor(props: FilePickerWidgetProps) {
    super(props);
    this.refreshUppy(props);
  }

  refreshUppy = (props: FilePickerWidgetProps) => {
    this.uppy = Uppy({
      id: this.props.widgetId,
      autoProceed: true,
      allowMultipleUploads: true,
      debug: false,
      restrictions: {
        maxFileSize: null,
        maxNumberOfFiles: props.maxNumFiles,
        minNumberOfFiles: null,
        allowedFileTypes: props.allowedFileTypes,
      },
    })
      .use(GoogleDrive, { companionUrl: "https://companion.uppy.io" })
      .use(Url, { companionUrl: "https://companion.uppy.io" })
      .use(OneDrive, {
        companionUrl: "https://companion.uppy.io/",
      })
      .use(Webcam, {
        onBeforeSnapshot: () => Promise.resolve(),
        countdown: false,
        mirror: true,
        facingMode: "user",
        locale: {},
      });
  };

  componentDidUpdate(prevProps: FilePickerWidgetProps) {
    super.componentDidUpdate(prevProps);
    if (
      prevProps.allowedFileTypes !== this.props.allowedFileTypes ||
      prevProps.maxNumFiles !== this.props.maxNumFiles
    ) {
      this.refreshUppy(this.props);
    }
  }

  componentDidMount() {
    super.componentDidMount();
    this.refreshUppy(this.props);
  }

  componentWillUnmount() {
    this.uppy.close();
  }

  getPageView() {
    return (
      <FilePickerComponent
        uppy={this.uppy}
        style={this.getPositionStyle()}
        widgetId={this.props.widgetId}
        key={this.props.widgetId}
        label={this.props.label}
      />
    );
  }

  getWidgetType(): WidgetType {
    return "FILE_PICKER_WIDGET";
  }
}

export interface FilePickerWidgetProps extends WidgetProps {
  label: string;
  maxNumFiles?: number;
  allowedFileTypes: string[];
}

export default FilePickerWidget;
