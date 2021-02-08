import React from "react";
import BaseWidget, { WidgetProps, WidgetState } from "./BaseWidget";
import { WidgetType } from "constants/WidgetConstants";
import FilePickerComponent from "components/designSystems/appsmith/FilePickerComponent";
import Uppy from "@uppy/core";
import GoogleDrive from "@uppy/google-drive";
import Webcam from "@uppy/webcam";
import Url from "@uppy/url";
import OneDrive from "@uppy/onedrive";
import {
  WidgetPropertyValidationType,
  BASE_WIDGET_VALIDATION,
} from "utils/WidgetValidation";
import { VALIDATION_TYPES } from "constants/WidgetValidation";
import { EventType, ExecutionResult } from "constants/ActionConstants";
import {
  DerivedPropertiesMap,
  TriggerPropertiesMap,
} from "utils/WidgetFactory";
import Dashboard from "@uppy/dashboard";
import shallowequal from "shallowequal";
import _ from "lodash";
import * as Sentry from "@sentry/react";
import withMeta, { WithMeta } from "./MetaHOC";

class FilePickerWidget extends BaseWidget<
  FilePickerWidgetProps,
  FilePickerWidgetState
> {
  constructor(props: FilePickerWidgetProps) {
    super(props);
    this.state = {
      isLoading: false,
      uppy: this.initializeUppy(),
    };
  }

  static getPropertyValidationMap(): WidgetPropertyValidationType {
    return {
      ...BASE_WIDGET_VALIDATION,
      label: VALIDATION_TYPES.TEXT,
      maxNumFiles: VALIDATION_TYPES.NUMBER,
      allowedFileTypes: VALIDATION_TYPES.ARRAY,
      files: VALIDATION_TYPES.ARRAY,
      isRequired: VALIDATION_TYPES.BOOLEAN,
      // onFilesSelected: VALIDATION_TYPES.ACTION_SELECTOR,
    };
  }

  static getDerivedPropertiesMap(): DerivedPropertiesMap {
    return {
      isValid: `{{ this.isRequired ? this.files.length > 0 : true }}`,
      value: `{{this.files}}`,
    };
  }

  static getMetaPropertiesMap(): Record<string, any> {
    return {
      files: [],
      uploadedFileData: {},
    };
  }

  static getTriggerPropertyMap(): TriggerPropertiesMap {
    return {
      onFilesSelected: true,
    };
  }

  /**
   * if uppy is not initialized before, initialize it
   * else setState of uppy instance
   */
  initializeUppy = () => {
    const uppyState = {
      id: this.props.widgetId,
      autoProceed: false,
      allowMultipleUploads: true,
      debug: false,
      restrictions: {
        maxFileSize: this.props.maxFileSize
          ? this.props.maxFileSize * 1024 * 1024
          : null,
        maxNumberOfFiles: this.props.maxNumFiles,
        minNumberOfFiles: null,
        allowedFileTypes:
          this.props.allowedFileTypes &&
          (this.props.allowedFileTypes.includes("*") ||
            _.isEmpty(this.props.allowedFileTypes))
            ? null
            : this.props.allowedFileTypes,
      },
    };

    return Uppy(uppyState);
  };

  /**
   * set states on the uppy instance with new values
   */
  reinitializeUppy = (props: FilePickerWidgetProps) => {
    const uppyState = {
      id: props.widgetId,
      autoProceed: false,
      allowMultipleUploads: true,
      debug: false,
      restrictions: {
        maxFileSize: props.maxFileSize ? props.maxFileSize * 1024 * 1024 : null,
        maxNumberOfFiles: props.maxNumFiles,
        minNumberOfFiles: null,
        allowedFileTypes:
          props.allowedFileTypes &&
          (this.props.allowedFileTypes.includes("*") ||
            _.isEmpty(props.allowedFileTypes))
            ? null
            : props.allowedFileTypes,
      },
    };

    this.state.uppy.setOptions(uppyState);
  };

  /**
   * add all uppy events listeners needed
   */
  initializeUppyEventListeners = () => {
    this.state.uppy
      .use(Dashboard, {
        target: "body",
        metaFields: [],
        inline: false,
        width: 750,
        height: 550,
        thumbnailWidth: 280,
        showLinkToFileUploadResult: true,
        showProgressDetails: false,
        hideUploadButton: false,
        hideProgressAfterFinish: false,
        note: null,
        closeAfterFinish: true,
        closeModalOnClickOutside: true,
        disableStatusBar: false,
        disableInformer: false,
        disableThumbnailGenerator: false,
        disablePageScrollWhenModalOpen: true,
        proudlyDisplayPoweredByUppy: false,
        onRequestCloseModal: () => {
          const plugin = this.state.uppy.getPlugin("Dashboard");

          if (plugin) {
            plugin.closeModal();
          }
        },
        locale: {},
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

    this.state.uppy.on("file-removed", (file: any) => {
      const updatedFiles = this.props.files
        ? this.props.files.filter((dslFile) => {
            return file.id !== dslFile.id;
          })
        : [];
      this.props.updateWidgetMetaProperty("files", updatedFiles);
    });

    this.state.uppy.on("files-added", (files: any[]) => {
      const dslFiles = this.props.files ? [...this.props.files] : [];

      const fileReaderPromises = files.map((file) => {
        const reader = new FileReader();
        return new Promise((resolve) => {
          reader.readAsDataURL(file.data);
          reader.onloadend = () => {
            const base64data = reader.result;
            const binaryReader = new FileReader();
            binaryReader.readAsBinaryString(file.data);
            binaryReader.onloadend = () => {
              const rawData = binaryReader.result;
              const textReader = new FileReader();
              textReader.readAsText(file.data);
              textReader.onloadend = () => {
                const text = textReader.result;
                const newFile = {
                  id: file.id,
                  base64: base64data,
                  blob: file.data,
                  raw: rawData,
                  text: text,
                  name: file.meta ? file.meta.name : undefined,
                };

                resolve(newFile);
              };
            };
          };
        });
      });

      Promise.all(fileReaderPromises).then((files) => {
        this.props.updateWidgetMetaProperty("files", dslFiles.concat(files));
      });
    });

    this.state.uppy.on("upload", () => {
      this.onFilesSelected();
    });
  };

  /**
   * this function is called when user selects the files and it do two things:
   * 1. calls the action if any
   * 2. set isLoading prop to true when calling the action
   */
  onFilesSelected = () => {
    if (this.props.onFilesSelected) {
      this.executeAction({
        dynamicString: this.props.onFilesSelected,
        event: {
          type: EventType.ON_FILES_SELECTED,
          callback: this.handleFileUploaded,
        },
      });

      this.setState({ isLoading: true });
    }
  };

  /**
   * sets uploadFilesUrl in meta propety and sets isLoading to false
   *
   * @param result
   */
  handleFileUploaded = (result: ExecutionResult) => {
    if (result.success) {
      this.props.updateWidgetMetaProperty(
        "uploadedFileUrls",
        this.props.uploadedFileUrlPaths,
      );

      this.setState({ isLoading: false });
    }
  };

  componentDidUpdate(prevProps: FilePickerWidgetProps) {
    super.componentDidUpdate(prevProps);
    if (
      prevProps.files &&
      prevProps.files.length > 0 &&
      this.props.files === undefined
    ) {
      this.state.uppy.reset();
    } else if (
      !shallowequal(prevProps.allowedFileTypes, this.props.allowedFileTypes) ||
      prevProps.maxNumFiles !== this.props.maxNumFiles ||
      prevProps.maxFileSize !== this.props.maxFileSize
    ) {
      this.reinitializeUppy(this.props);
    }
  }

  componentDidMount() {
    super.componentDidMount();

    this.initializeUppyEventListeners();
  }

  componentWillUnmount() {
    this.state.uppy.close();
  }

  getPageView() {
    return (
      <FilePickerComponent
        uppy={this.state.uppy}
        widgetId={this.props.widgetId}
        key={this.props.widgetId}
        label={this.props.label}
        files={this.props.files || []}
        isLoading={this.props.isLoading || this.state.isLoading}
        isDisabled={this.props.isDisabled}
      />
    );
  }

  getWidgetType(): WidgetType {
    return "FILE_PICKER_WIDGET";
  }
}

export interface FilePickerWidgetState extends WidgetState {
  isLoading: boolean;
  uppy: any;
}

export interface FilePickerWidgetProps extends WidgetProps, WithMeta {
  label: string;
  maxNumFiles?: number;
  maxFileSize?: number;
  files?: any[];
  allowedFileTypes: string[];
  onFilesSelected?: string;
  isRequired?: boolean;
  uploadedFileUrlPaths?: string;
}

export default FilePickerWidget;
export const ProfiledFilePickerWidget = Sentry.withProfiler(
  withMeta(FilePickerWidget),
);
