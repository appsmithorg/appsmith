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
} from "utils/ValidationFactory";
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
  uppy: any;

  constructor(props: FilePickerWidgetProps) {
    super(props);
    this.state = {
      version: 0,
    };
  }

  static getPropertyPaneConfig() {
    return [
      {
        sectionName: "General",
        children: [
          {
            propertyName: "label",
            label: "Label",
            controlType: "INPUT_TEXT",
            helpText: "Sets the label of the button",
            placeholderText: "Enter label text",
            inputType: "TEXT",
          },
          {
            propertyName: "maxNumFiles",
            label: "Max No. files",
            helpText:
              "Sets the maximum number of files that can be uploaded at once",
            controlType: "INPUT_TEXT",
            placeholderText: "Enter no. of files",
            inputType: "INTEGER",
          },
          {
            propertyName: "maxFileSize",
            helpText: "Sets the maximum size of each file that can be uploaded",
            label: "Max file size",
            controlType: "INPUT_TEXT",
            placeholderText: "File size in mb",
            inputType: "INTEGER",
          },
          {
            propertyName: "allowedFileTypes",
            helpText: "Restricts the type of files which can be uploaded",
            label: "Allowed File Types",
            controlType: "MULTI_SELECT",
            placeholderText: "Select file types",
            options: [
              {
                label: "Any File",
                value: "*",
              },
              {
                label: "Images",
                value: "image/*",
              },
              {
                label: "Videos",
                value: "video/*",
              },
              {
                label: "Audio",
                value: "audio/*",
              },
              {
                label: "Text",
                value: "text/*",
              },
              {
                label: "MS Word",
                value: ".doc",
              },
              {
                label: "JPEG",
                value: "image/jpeg",
              },
              {
                label: "PNG",
                value: ".png",
              },
            ],
            isJSConvertible: true,
          },
          {
            propertyName: "isRequired",
            label: "Required",
            helpText: "Makes input to the widget mandatory",
            controlType: "SWITCH",
            isJSConvertible: true,
          },
          {
            propertyName: "isVisible",
            label: "Visible",
            helpText: "Controls the visibility of the widget",
            controlType: "SWITCH",
            isJSConvertible: true,
          },
          {
            propertyName: "uploadedFileUrlPaths",
            helpText:
              "Stores the url of the uploaded file so that it can be referenced in an action later",
            label: "Uploaded File URLs",
            controlType: "INPUT_TEXT",
            placeholderText: 'Enter [ "url1", "url2" ]',
            inputType: "TEXT",
          },
          {
            propertyName: "isDisabled",
            label: "Disable",
            helpText: "Disables input to this widget",
            controlType: "SWITCH",
            isJSConvertible: true,
          },
        ],
      },
      {
        sectionName: "Actions",
        children: [
          {
            helpText:
              "Triggers an action when the user selects a file. Upload files to a CDN here and store their urls in uploadedFileUrls",
            propertyName: "onFilesSelected",
            label: "onFilesSelected",
            controlType: "ACTION_SELECTOR",
            isJSConvertible: true,
          },
        ],
      },
    ];
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

  refreshUppy = (props: FilePickerWidgetProps) => {
    this.uppy = Uppy({
      id: this.props.widgetId,
      autoProceed: false,
      allowMultipleUploads: true,
      debug: false,
      restrictions: {
        maxFileSize: props.maxFileSize ? props.maxFileSize * 1024 * 1024 : null,
        maxNumberOfFiles: props.maxNumFiles,
        minNumberOfFiles: null,
        allowedFileTypes:
          props.allowedFileTypes &&
          (props.allowedFileTypes.includes("*") ||
            _.isEmpty(props.allowedFileTypes))
            ? null
            : props.allowedFileTypes,
      },
    })
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
          this.uppy.getPlugin("Dashboard").closeModal();
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
    this.uppy.on("file-removed", (file: any) => {
      const updatedFiles = this.props.files
        ? this.props.files.filter(dslFile => {
            return file.id !== dslFile.id;
          })
        : [];
      this.props.updateWidgetMetaProperty("files", updatedFiles);
    });
    this.uppy.on("file-added", (file: any) => {
      const dslFiles = this.props.files || [];
      const reader = new FileReader();
      reader.readAsDataURL(file.data);
      reader.onloadend = () => {
        const base64data = reader.result;
        const newFile = {
          id: file.id,
          base64: base64data,
          blob: file.data,
        };
        dslFiles.push(newFile);
        this.props.updateWidgetMetaProperty("files", dslFiles);
      };
    });
    this.uppy.on("upload", () => {
      this.onFilesSelected();
    });
    this.setState({ version: this.state.version + 1 });
  };

  static getTriggerPropertyMap(): TriggerPropertiesMap {
    return {
      onFilesSelected: true,
    };
  }

  onFilesSelected() {
    if (this.props.onFilesSelected) {
      this.executeAction({
        dynamicString: this.props.onFilesSelected,
        event: {
          type: EventType.ON_FILES_SELECTED,
          callback: this.handleFileUploaded,
        },
      });
    }
  }

  handleFileUploaded = (result: ExecutionResult) => {
    if (result.success) {
      this.props.updateWidgetMetaProperty(
        "uploadedFileUrls",
        this.props.uploadedFileUrlPaths,
      );
    }
  };

  componentDidUpdate(prevProps: FilePickerWidgetProps) {
    super.componentDidUpdate(prevProps);
    if (
      prevProps.files &&
      prevProps.files.length > 0 &&
      this.props.files === undefined
    ) {
      this.uppy.reset();
    } else if (
      !shallowequal(prevProps.allowedFileTypes, this.props.allowedFileTypes) ||
      prevProps.maxNumFiles !== this.props.maxNumFiles ||
      prevProps.maxFileSize !== this.props.maxFileSize
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
        widgetId={this.props.widgetId}
        key={this.props.widgetId}
        label={this.props.label}
        files={this.props.files || []}
        isLoading={this.props.isLoading}
        isDisabled={this.props.isDisabled}
      />
    );
  }

  getWidgetType(): WidgetType {
    return "FILE_PICKER_WIDGET";
  }
}

export interface FilePickerWidgetState extends WidgetState {
  version: number;
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
