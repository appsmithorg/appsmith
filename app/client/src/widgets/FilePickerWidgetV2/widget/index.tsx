import React from "react";
import BaseWidget, { WidgetProps, WidgetState } from "widgets/BaseWidget";
import { WidgetType } from "constants/WidgetConstants";
import FilePickerComponent from "../component";
import Uppy from "@uppy/core";
import GoogleDrive from "@uppy/google-drive";
import Webcam from "@uppy/webcam";
import Url from "@uppy/url";
import OneDrive from "@uppy/onedrive";
import { ValidationTypes } from "constants/WidgetValidation";
import { EventType } from "constants/AppsmithActionConstants/ActionConstants";
import { DerivedPropertiesMap } from "utils/WidgetFactory";
import Dashboard from "@uppy/dashboard";
import shallowequal from "shallowequal";
import _, { findIndex } from "lodash";
import FileDataTypes from "../constants";
import { EvaluationSubstitutionType } from "entities/DataTree/dataTreeFactory";
import { createBlobUrl, isBlobUrl } from "utils/AppsmithUtils";
import log from "loglevel";
import { createGlobalStyle } from "styled-components";
import UpIcon from "assets/icons/ads/up-arrow.svg";
import CloseIcon from "assets/icons/ads/cross.svg";
import { Colors } from "constants/Colors";
import Papa from "papaparse";
import { klona } from "klona";
import { UppyFile } from "@uppy/utils";

const CSV_ARRAY_LABEL = "Array (CSVs only)";
const CSV_FILE_TYPE_REGEX = /.+(\/csv)$/;

const ARRAY_CSV_HELPER_TEXT = `All non csv filetypes will have an empty value. \n Large files used in widgets directly might slow down the app.`;

const isCSVFileType = (str: string) => CSV_FILE_TYPE_REGEX.test(str);

type Result = string | Buffer | ArrayBuffer | null;

const FilePickerGlobalStyles = createGlobalStyle<{
  borderRadius?: string;
}>`

  /* Sets the font-family to theming font-family of the upload modal */
  .uppy-Root {
    font-family: var(--wds-font-family);
  }

  /*********************************************************/
  /* Set the new dropHint upload icon */
  .uppy-Dashboard-dropFilesHereHint {
    background-image: none;
    border-radius: ${({ borderRadius }) => borderRadius};
  }

  .uppy-Dashboard-dropFilesHereHint::before {
    border: 2.5px solid var(--wds-accent-color);
    width: 60px;
    height: 60px;
    border-radius: ${({ borderRadius }) => borderRadius};
    display: inline-block;
    content: ' ';
    position: absolute;
    top: 43%;
  }

  .uppy-Dashboard-dropFilesHereHint::after {
    display: inline-block;
    content: ' ';
    position: absolute;
    top: 46%;
    width: 30px;
    height: 30px;

    -webkit-mask-image: url(${UpIcon});
    -webkit-mask-repeat: no-repeat;
    -webkit-mask-position: center;
    -webkit-mask-size: 30px;
    background: var(--wds-accent-color);
  }
  /*********************************************************/

  /*********************************************************/
  /* Set the styles for the upload button */
  .uppy-StatusBar-actionBtn--upload {
    background-color: var(--wds-accent-color) !important;
    border-radius: ${({ borderRadius }) => borderRadius};
  }

  .uppy-Dashboard-Item-action--remove {

    /* Sets the border radius of the button when it is focused */
    &:focus {
      border-radius: ${({ borderRadius }) =>
        borderRadius === "0.375rem" ? "0.25rem" : borderRadius} !important;
    }

    .uppy-c-icon {
      & path:first-child {
      /* Sets the black background of remove file button hidden */
        visibility: hidden;
      }

      & path:last-child {
      /* Sets the cross mark color of remove file button */
        fill: #858282;
      }

      background-color: #FFFFFF;
      box-shadow: 0px 1px 2px rgba(0, 0, 0, 0.06), 0px 1px 3px rgba(0, 0, 0, 0.1);

      & {
      /* Sets the black background of remove file button hidden*/
        border-radius: ${({ borderRadius }) =>
          borderRadius === "0.375rem" ? "0.25rem" : borderRadius};
      }
    }
  }
  /*********************************************************/

  /*********************************************************/
  /* Sets the back cancel button color to match theming primary color */
  .uppy-DashboardContent-back {
    color: var(--wds-accent-color);

    &:hover {
      color: var(--wds-accent-color);
      background-color: ${Colors.ATHENS_GRAY};
    }
  }
  /*********************************************************/

  /*********************************************************/
  /* Sets the style according to reskinning for x button at the top right corner of the modal */
  .uppy-Dashboard-close {
    background-color: white;
    width: 32px;
    height: 32px;
    text-align: center;
    top: -33px;
    border-radius: ${({ borderRadius }) => borderRadius};

      & span {
        font-size: 0;
      }

      & span::after {
        content: ' ';
        -webkit-mask-image: url(${CloseIcon});
        -webkit-mask-repeat: no-repeat;
        -webkit-mask-position: center;
        -webkit-mask-size: 20px;
        background: #858282;
        position: absolute;
        top: 32%;
        left: 32%;
        width: 12px;
        height: 12px;
      }
    }
  }
  /*********************************************************/


  /*********************************************************/
  /* Sets the border radius of the upload modal */
  .uppy-Dashboard-inner, .uppy-Dashboard-innerWrap {
    border-radius: ${({ borderRadius }) => borderRadius} !important;
  }

  .uppy-Dashboard-AddFiles {
    border-radius: ${({ borderRadius }) => borderRadius} !important;
  }
  /*********************************************************/

  /*********************************************************/
  /* Sets the error message style according to reskinning*/
  .uppy-Informer {
    bottom: 82px;
    & p[role="alert"] {
      border-radius: ${({ borderRadius }) => borderRadius};
      background-color: transparent;
      color: #D91921;
      border: 1px solid #D91921;
    }
  }
  /*********************************************************/

  /*********************************************************/
  /* Style the + add more files button on top right corner of the upload modal */
  .uppy-DashboardContent-addMore {
    color: var(--wds-accent-color);
    font-weight: 400;
    &:hover {
      background-color: ${Colors.ATHENS_GRAY};
      color: var(--wds-accent-color);
    }

    & svg {
      fill: var(--wds-accent-color) !important;
    }
  }
  /*********************************************************/

}
`;
class FilePickerWidget extends BaseWidget<
  FilePickerWidgetProps,
  FilePickerWidgetState
> {
  private isWidgetUnmounting: boolean;

  constructor(props: FilePickerWidgetProps) {
    super(props);
    this.isWidgetUnmounting = false;
    this.state = {
      isLoading: false,
      uppy: this.initializeUppy(),
    };
  }

  static getPropertyPaneContentConfig() {
    return [
      {
        sectionName: "Basic",
        children: [
          {
            propertyName: "allowedFileTypes",
            helpText: "Restricts the type of files which can be uploaded",
            label: "Allowed File Types",
            controlType: "DROP_DOWN",
            isMultiSelect: true,
            placeholderText: "Select File types",
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
                unique: true,
                children: {
                  type: ValidationTypes.TEXT,
                },
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
            helperText: (props: FilePickerWidgetProps) => {
              return props.fileDataType === FileDataTypes.Array
                ? ARRAY_CSV_HELPER_TEXT
                : "";
            },
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
              {
                label: CSV_ARRAY_LABEL,
                value: FileDataTypes.Array,
              },
            ],
            isBindProperty: false,
            isTriggerProperty: false,
          },
          {
            propertyName: "dynamicTyping",
            label: "Infer data-types from CSV",
            helpText:
              "Controls if the arrays should try to infer the best possible data type based on the values in csv files",
            controlType: "SWITCH",
            isJSConvertible: false,
            isBindProperty: true,
            isTriggerProperty: false,
            hidden: (props: FilePickerWidgetProps) => {
              return props.fileDataType !== FileDataTypes.Array;
            },
            dependencies: ["fileDataType"],
            validation: { type: ValidationTypes.BOOLEAN },
          },
          {
            propertyName: "maxNumFiles",
            label: "Max No. of files",
            helpText:
              "Sets the maximum number of files that can be uploaded at once",
            controlType: "INPUT_TEXT",
            placeholderText: "1",
            inputType: "INTEGER",
            isBindProperty: true,
            isTriggerProperty: false,
            validation: { type: ValidationTypes.NUMBER },
          },
        ],
      },
      {
        sectionName: "Label",
        children: [
          {
            propertyName: "label",
            label: "Text",
            controlType: "INPUT_TEXT",
            helpText: "Sets the label of the button",
            placeholderText: "Select Files",
            inputType: "TEXT",
            isBindProperty: true,
            isTriggerProperty: false,
            validation: { type: ValidationTypes.TEXT },
          },
        ],
      },
      {
        sectionName: "Validation",
        children: [
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
            propertyName: "maxFileSize",
            helpText: "Sets the maximum size of each file that can be uploaded",
            label: "Max file size(Mb)",
            controlType: "INPUT_TEXT",
            placeholderText: "5",
            inputType: "INTEGER",
            isBindProperty: true,
            isTriggerProperty: false,
            validation: {
              type: ValidationTypes.NUMBER,
              params: { min: 1, max: 100, default: 5 },
            },
          },
        ],
      },
      {
        sectionName: "General",
        children: [
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

  static getPropertyPaneStyleConfig() {
    return [
      {
        sectionName: "Color",
        children: [
          {
            propertyName: "buttonColor",
            helpText: "Changes the color of the button",
            label: "Button Color",
            controlType: "COLOR_PICKER",
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: false,
            validation: { type: ValidationTypes.TEXT },
          },
        ],
      },
      {
        sectionName: "Border and Shadow",
        children: [
          {
            propertyName: "borderRadius",
            label: "Border Radius",
            helpText:
              "Rounds the corners of the icon button's outer border edge",
            controlType: "BORDER_RADIUS_OPTIONS",

            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: false,
            validation: { type: ValidationTypes.TEXT },
          },
          {
            propertyName: "boxShadow",
            label: "Box Shadow",
            helpText:
              "Enables you to cast a drop shadow from the frame of the widget",
            controlType: "BOX_SHADOW_OPTIONS",
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: false,
            validation: { type: ValidationTypes.TEXT },
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
      files: `{{this.selectedFiles}}`,
    };
  }

  static getMetaPropertiesMap(): Record<string, any> {
    return {
      selectedFiles: [],
      uploadedFileData: {},
      isDirty: false,
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

    this.state.uppy.on("file-removed", (file: any, reason: any) => {
      /**
       * The below line will not update the selectedFiles meta prop when cancel-all event is triggered.
       * cancel-all event occurs when close or reset function of uppy is executed.
       * Uppy provides an argument called reason. It helps us to distinguish on which event the file-removed event was called.
       * Refer to the following issue to know about reason prop: https://github.com/transloadit/uppy/pull/2323
       */
      if (reason === "removed-by-user") {
        const fileCount = this.props.selectedFiles?.length || 0;

        /**
         * Once the file is removed we update the selectedFiles
         * with the current files present in the uppy's internal state
         */
        const updatedFiles = this.state.uppy
          .getFiles()
          .map((currentFile: UppyFile, index: number) => ({
            type: currentFile.type,
            id: currentFile.id,
            data: currentFile.data,
            name: currentFile.meta
              ? currentFile.meta.name
              : `File-${index + fileCount}`,
            size: currentFile.size,
            dataFormat: this.props.fileDataType,
          }));
        this.props.updateWidgetMetaProperty(
          "selectedFiles",
          updatedFiles ?? [],
        );
      }

      if (reason === "cancel-all" && !this.isWidgetUnmounting) {
        this.props.updateWidgetMetaProperty("selectedFiles", []);
      }
    });

    this.state.uppy.on("files-added", (files: any[]) => {
      // Deep cloning the selectedFiles
      const selectedFiles = this.props.selectedFiles
        ? klona(this.props.selectedFiles)
        : [];

      const fileCount = this.props.selectedFiles?.length || 0;
      const fileReaderPromises = files.map((file, index) => {
        return new Promise((resolve) => {
          if (file.size < 5000 * 1000) {
            const reader = new FileReader();
            if (this.props.fileDataType === FileDataTypes.Base64) {
              reader.readAsDataURL(file.data);
            } else if (this.props.fileDataType === FileDataTypes.Binary) {
              reader.readAsBinaryString(file.data);
            } else {
              reader.readAsText(file.data);
            }
            reader.onloadend = () => {
              const newFile = {
                type: file.type,
                id: file.id,
                data: this.parseUploadResult(
                  reader.result,
                  file.type,
                  this.props.fileDataType,
                ),
                meta: file.meta,
                name: file.meta ? file.meta.name : `File-${index + fileCount}`,
                size: file.size,
                dataFormat: this.props.fileDataType,
              };
              resolve(newFile);
            };
          } else {
            const data = createBlobUrl(file.data, this.props.fileDataType);
            const newFile = {
              type: file.type,
              id: file.id,
              data: data,
              meta: file.meta,
              name: file.meta ? file.meta.name : `File-${index + fileCount}`,
              size: file.size,
              dataFormat: this.props.fileDataType,
            };
            resolve(newFile);
          }
        });
      });

      Promise.all(fileReaderPromises).then((files) => {
        if (!this.props.isDirty) {
          this.props.updateWidgetMetaProperty("isDirty", true);
        }

        if (selectedFiles.length !== 0) {
          files.forEach((fileItem: any) => {
            if (!fileItem?.meta?.isInitializing) {
              selectedFiles.push(fileItem);
            }
          });
          this.props.updateWidgetMetaProperty("selectedFiles", selectedFiles);
        } else {
          // update with newly added files when the selectedFiles is empty.
          this.props.updateWidgetMetaProperty("selectedFiles", [...files]);
        }
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
    super.componentDidUpdate(prevProps);
    const { selectedFiles: previousSelectedFiles = [] } = prevProps;
    const { selectedFiles = [] } = this.props;
    if (previousSelectedFiles.length && selectedFiles.length === 0) {
      this.state.uppy.reset();
    } else if (
      !shallowequal(prevProps.allowedFileTypes, this.props.allowedFileTypes) ||
      prevProps.maxNumFiles !== this.props.maxNumFiles ||
      prevProps.maxFileSize !== this.props.maxFileSize
    ) {
      this.reinitializeUppy(this.props);
    }
    this.clearFilesFromMemory(prevProps.selectedFiles);
  }
  // Reclaim the memory used by blobs.
  clearFilesFromMemory(previousFiles: any[] = []) {
    const { selectedFiles: newFiles = [] } = this.props;
    previousFiles.forEach((file: any) => {
      let { data: blobUrl } = file;
      if (isBlobUrl(blobUrl)) {
        if (findIndex(newFiles, (f) => f.data === blobUrl) === -1) {
          blobUrl = blobUrl.split("?")[0];
          URL.revokeObjectURL(blobUrl);
        }
      }
    });
  }

  initializeSelectedFiles() {
    /**
     * Since on unMount the uppy instance closes and it's internal state is lost along with the files present in it.
     * Below we add the files again to the uppy instance so that the files are retained.
     */
    this.props.selectedFiles?.forEach((fileItem: any) => {
      this.state.uppy.addFile({
        name: fileItem.name,
        type: fileItem.type,
        data: new Blob([fileItem.data]),
        meta: {
          // Adding this flag to distinguish a file in the files-added event
          isInitializing: true,
        },
      });
    });
  }

  componentDidMount() {
    super.componentDidMount();

    try {
      this.initializeUppyEventListeners();
      this.initializeSelectedFiles();
    } catch (e) {
      log.debug("Error in initializing uppy");
    }
  }

  componentWillUnmount() {
    this.isWidgetUnmounting = true;
    this.state.uppy.close();
  }

  getPageView() {
    return (
      <>
        <FilePickerComponent
          borderRadius={this.props.borderRadius}
          boxShadow={this.props.boxShadow}
          buttonColor={this.props.buttonColor}
          files={this.props.selectedFiles || []}
          isDisabled={this.props.isDisabled}
          isLoading={this.props.isLoading || this.state.isLoading}
          key={this.props.widgetId}
          label={this.props.label}
          uppy={this.state.uppy}
          widgetId={this.props.widgetId}
        />
        {this.state.uppy && this.state.uppy.getID() === this.props.widgetId && (
          <FilePickerGlobalStyles borderRadius={this.props.borderRadius} />
        )}
      </>
    );
  }

  parseUploadResult(
    result: Result,
    fileType: string,
    dataFormat: FileDataTypes,
  ) {
    if (
      dataFormat !== FileDataTypes.Array ||
      !isCSVFileType(fileType) ||
      !result
    ) {
      return result;
    }

    const data: Record<string, string>[] = [];
    const errors: Papa.ParseError[] = [];

    function chunk(results: Papa.ParseStepResult<any>) {
      if (results?.errors?.length) {
        errors.push(...results.errors);
      }
      data.push(...results.data);
    }

    if (typeof result === "string") {
      const config = {
        header: true,
        dynamicTyping: this.props.dynamicTyping,
        chunk,
      };
      try {
        const startParsing = performance.now();

        Papa.parse(result, config);

        const endParsing = performance.now();

        log.debug(
          `### FILE_PICKER_WIDGET_V2 - ${this.props.widgetName} - CSV PARSING  `,
          `${endParsing - startParsing} ms`,
        );

        return data;
      } catch (error) {
        log.error(errors);
        return [];
      }
    } else {
      return [];
    }
  }

  static getWidgetType(): WidgetType {
    return "FILE_PICKER_WIDGET_V2";
  }
}

interface FilePickerWidgetState extends WidgetState {
  isLoading: boolean;
  uppy: any;
}

interface FilePickerWidgetProps extends WidgetProps {
  label: string;
  maxNumFiles?: number;
  maxFileSize?: number;
  selectedFiles?: any[];
  allowedFileTypes: string[];
  onFilesSelected?: string;
  fileDataType: FileDataTypes;
  isRequired?: boolean;
  backgroundColor: string;
  borderRadius: string;
  boxShadow?: string;
  dynamicTyping?: boolean;
}

export type FilePickerWidgetV2Props = FilePickerWidgetProps;
export type FilePickerWidgetV2State = FilePickerWidgetState;

export default FilePickerWidget;
