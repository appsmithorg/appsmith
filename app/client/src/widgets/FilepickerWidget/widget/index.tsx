import React from "react";
import type { WidgetProps, WidgetState } from "../../BaseWidget";
import BaseWidget from "../../BaseWidget";
import type { WidgetType } from "constants/WidgetConstants";
import FilePickerComponent from "../component";
import Uppy from "@uppy/core";
import GoogleDrive from "@uppy/google-drive";
import Webcam from "@uppy/webcam";
import Url from "@uppy/url";
import OneDrive from "@uppy/onedrive";
import { ValidationTypes } from "constants/WidgetValidation";
import { EventType } from "constants/AppsmithActionConstants/ActionConstants";
import type { DerivedPropertiesMap } from "utils/WidgetFactory";
import Dashboard from "@uppy/dashboard";
import shallowequal from "shallowequal";
import _ from "lodash";
import FileDataTypes from "./FileDataTypes";
import log from "loglevel";
import { EvaluationSubstitutionType } from "entities/DataTree/dataTreeFactory";

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
            isBindProperty: true,
            isTriggerProperty: false,
            validation: { type: ValidationTypes.TEXT },
          },
          {
            propertyName: "maxNumFiles",
            label: "Max No. files",
            helpText:
              "Sets the maximum number of files that can be uploaded at once",
            controlType: "INPUT_TEXT",
            placeholderText: "Enter no. of files",
            inputType: "INTEGER",
            isBindProperty: true,
            isTriggerProperty: false,
            validation: { type: ValidationTypes.NUMBER },
          },
          {
            propertyName: "maxFileSize",
            helpText: "Sets the maximum size of each file that can be uploaded",
            label: "Max file size(Mb)",
            controlType: "INPUT_TEXT",
            placeholderText: "File size in mb",
            inputType: "INTEGER",
            isBindProperty: true,
            isTriggerProperty: false,
            validation: {
              type: ValidationTypes.NUMBER,
              params: {
                min: 1,
                max: 100,
                default: 5,
                passThroughOnZero: false,
              },
            },
          },
          {
            propertyName: "allowedFileTypes",
            helpText: "Restricts the type of files which can be uploaded",
            label: "Allowed File Types",
            controlType: "DROP_DOWN",
            isMultiSelect: true,
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
            isBindProperty: true,
            isTriggerProperty: false,
            validation: {
              type: ValidationTypes.ARRAY,
              params: {
                allowedValues: [
                  "*",
                  "image/*",
                  "video/*",
                  "audio/*",
                  "text/*",
                  ".doc",
                  "image/jpeg",
                  ".png",
                ],
              },
            },
            evaluationSubstitutionType:
              EvaluationSubstitutionType.SMART_SUBSTITUTE,
          },
          {
            helpText: "Set the format of the data read from the files",
            propertyName: "fileDataType",
            label: "Data Format",
            controlType: "DROP_DOWN",
            options: [
              {
                label: FileDataTypes.Base64,
                value: FileDataTypes.Base64,
              },
              {
                label: FileDataTypes.Binary,
                value: FileDataTypes.Binary,
              },
              {
                label: FileDataTypes.Text,
                value: FileDataTypes.Text,
              },
            ],
            isBindProperty: false,
            isTriggerProperty: false,
          },
          {
            propertyName: "isRequired",
            label: "Required",
            helpText: "Makes input to the widget mandatory",
            controlType: "SWITCH",
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: false,
            validation: { type: ValidationTypes.BOOLEAN },
          },
          {
            propertyName: "isVisible",
            label: "Visible",
            helpText: "Controls the visibility of the widget",
            controlType: "SWITCH",
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: false,
            validation: { type: ValidationTypes.BOOLEAN },
          },
          {
            propertyName: "isDisabled",
            label: "Disable",
            helpText: "Disables input to this widget",
            controlType: "SWITCH",
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: false,
            validation: { type: ValidationTypes.BOOLEAN },
          },
          {
            propertyName: "animateLoading",
            label: "Animate Loading",
            controlType: "SWITCH",
            helpText: "Controls the loading of the widget",
            defaultValue: true,
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: false,
            validation: { type: ValidationTypes.BOOLEAN },
          },
        ],
      },
      {
        sectionName: "Events",
        children: [
          {
            helpText:
              "Triggers an action when the user selects a file. Upload files to a CDN and stores their URLs in filepicker.files",
            propertyName: "onFilesSelected",
            label: "onFilesSelected",
            controlType: "ACTION_SELECTOR",
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: true,
          },
        ],
      },
    ];
  }
  static getDefaultPropertiesMap(): Record<string, string> {
    return {};
  }
  static getDerivedPropertiesMap(): DerivedPropertiesMap {
    return {
      isValid: `{{ this.isRequired ? this.files.length > 0 : true }}`,
      files: `{{this.selectedFiles.map((file) => { return { ...file, data: this.fileDataType === "Base64" ? file.base64 : this.fileDataType === "Binary" ? file.raw : file.text } })}}`,
    };
  }

  static getMetaPropertiesMap(): Record<string, any> {
    return {
      selectedFiles: [],
      uploadedFileData: {},
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
        locale: {
          strings: {
            closeModal: "Close",
          },
        },
      })
      .use(GoogleDrive, { companionUrl: "https://companion.uppy.io" })
      .use(Url, { companionUrl: "https://companion.uppy.io" })
      .use(OneDrive, {
        companionUrl: "https://companion.uppy.io/",
      });

    if (location.protocol === "https:") {
      this.state.uppy.use(Webcam, {
        onBeforeSnapshot: () => Promise.resolve(),
        countdown: false,
        mirror: true,
        facingMode: "user",
        locale: {},
      });
    }

    this.state.uppy.on("file-removed", (file: any) => {
      const updatedFiles = this.props.selectedFiles
        ? this.props.selectedFiles.filter((dslFile) => {
            return file.id !== dslFile.id;
          })
        : [];
      this.props.updateWidgetMetaProperty("selectedFiles", updatedFiles);
    });

    this.state.uppy.on("files-added", (files: any[]) => {
      const dslFiles = this.props.selectedFiles
        ? [...this.props.selectedFiles]
        : [];
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
                  type: file.type,
                  id: file.id,
                  base64: base64data,
                  raw: rawData,
                  text: text,
                  data:
                    this.props.fileDataType === FileDataTypes.Base64
                      ? base64data
                      : this.props.fileDataType === FileDataTypes.Binary
                      ? rawData
                      : text,
                  name: file.meta ? file.meta.name : undefined,
                };

                resolve(newFile);
              };
            };
          };
        });
      });

      Promise.all(fileReaderPromises).then((files) => {
        this.props.updateWidgetMetaProperty(
          "selectedFiles",
          dslFiles.concat(files),
        );
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
      super.executeAction({
        triggerPropertyName: "onFilesSelected",
        dynamicString: this.props.onFilesSelected,
        event: {
          type: EventType.ON_FILES_SELECTED,
          callback: this.handleActionComplete,
        },
      });

      this.setState({ isLoading: true });
    }
  };

  handleActionComplete = () => {
    this.setState({ isLoading: false });
  };

  componentDidUpdate(prevProps: FilePickerWidgetProps) {
    if (
      prevProps.selectedFiles &&
      prevProps.selectedFiles.length > 0 &&
      this.props.selectedFiles === undefined
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
    try {
      this.initializeUppyEventListeners();
    } catch (e) {
      log.debug("Error in initializing uppy");
    }
  }

  componentWillUnmount() {
    this.state.uppy.close();
  }

  getPageView() {
    return (
      <FilePickerComponent
        files={this.props.selectedFiles || []}
        isDisabled={this.props.isDisabled}
        isLoading={this.props.isLoading || this.state.isLoading}
        key={this.props.widgetId}
        label={this.props.label}
        uppy={this.state.uppy}
        widgetId={this.props.widgetId}
      />
    );
  }

  static getWidgetType(): WidgetType {
    return "FILE_PICKER_WIDGET";
  }
}

export interface FilePickerWidgetState extends WidgetState {
  isLoading: boolean;
  uppy: any;
}

export interface FilePickerWidgetProps extends WidgetProps {
  label: string;
  maxNumFiles?: number;
  maxFileSize?: number;
  selectedFiles?: any[];
  allowedFileTypes: string[];
  onFilesSelected?: string;
  fileDataType: FileDataTypes;
  isRequired?: boolean;
}

export default FilePickerWidget;
