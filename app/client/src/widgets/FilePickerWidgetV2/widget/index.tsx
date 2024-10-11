import type Dashboard from "@uppy/dashboard";
import type { Uppy } from "@uppy/core";
import type { UppyFile } from "@uppy/utils";
import { EventType } from "constants/AppsmithActionConstants/ActionConstants";
import { FILE_SIZE_LIMIT_FOR_BLOBS } from "constants/WidgetConstants";
import { ValidationTypes } from "constants/WidgetValidation";
import type { SetterConfig, Stylesheet } from "entities/AppTheming";
import { EvaluationSubstitutionType } from "entities/DataTree/dataTreeFactory";
import _, { findIndex } from "lodash";
import log from "loglevel";

import React from "react";
import shallowequal from "shallowequal";
import { createBlobUrl, isBlobUrl } from "utils/AppsmithUtils";
import type { DerivedPropertiesMap } from "WidgetProvider/factory";
import { importUppy, isUppyLoaded } from "utils/importUppy";
import type { WidgetProps, WidgetState } from "widgets/BaseWidget";
import BaseWidget from "widgets/BaseWidget";
import FilePickerComponent from "../component";
import FileDataTypes from "../constants";
import { DefaultAutocompleteDefinitions } from "widgets/WidgetUtils";
import type {
  AnvilConfig,
  AutocompletionDefinitions,
} from "WidgetProvider/constants";
import parseFileData from "./FileParser";
import { FilePickerGlobalStyles } from "./index.styled";
import { BUTTON_MIN_WIDTH } from "constants/minWidthConstants";
import { ResponsiveBehavior } from "layoutSystems/common/utils/constants";
import IconSVG from "../icon.svg";
import ThumbnailSVG from "../thumbnail.svg";
import { WIDGET_TAGS } from "constants/WidgetConstants";
import { klonaRegularWithTelemetry } from "utils/helpers";

const CSV_ARRAY_LABEL = "Array of Objects (CSV, XLS(X), JSON, TSV)";

const ARRAY_CSV_HELPER_TEXT = `All non CSV, XLS(X), JSON or TSV filetypes will have an empty value. \n Large files used in widgets directly might slow down the app.`;

class FilePickerWidget extends BaseWidget<
  FilePickerWidgetProps,
  FilePickerWidgetState
> {
  private isWidgetUnmounting: boolean;

  constructor(props: FilePickerWidgetProps) {
    super(props);
    this.isWidgetUnmounting = false;
    this.state = {
      areFilesLoading: false,
      isWaitingForUppyToLoad: false,
      isUppyModalOpen: false,
    };
  }

  static type = "FILE_PICKER_WIDGET_V2";

  static getConfig() {
    return {
      name: "FilePicker",
      iconSVG: IconSVG,
      thumbnailSVG: ThumbnailSVG,
      tags: [WIDGET_TAGS.INPUTS],
      needsMeta: true,
      searchTags: ["upload"],
    };
  }

  static getDefaults() {
    return {
      rows: 4,
      files: [],
      selectedFiles: [],
      allowedFileTypes: [],
      label: "Select Files",
      columns: 16,
      maxNumFiles: 1,
      maxFileSize: 5,
      fileDataType: FileDataTypes.Base64,
      dynamicTyping: true,
      widgetName: "FilePicker",
      isDefaultClickDisabled: true,
      version: 1,
      isRequired: false,
      isDisabled: false,
      animateLoading: true,
      responsiveBehavior: ResponsiveBehavior.Hug,
      minWidth: BUTTON_MIN_WIDTH,
    };
  }

  static getAutoLayoutConfig() {
    return {
      defaults: {
        rows: 4,
        columns: 6.632,
      },
      autoDimension: {
        width: true,
      },
      widgetSize: [
        {
          viewportMinWidth: 0,
          configuration: () => {
            return {
              minWidth: "120px",
              maxWidth: "360px",
              minHeight: "40px",
            };
          },
        },
      ],
      disableResizeHandles: {
        horizontal: true,
        vertical: true,
      },
    };
  }

  static getAnvilConfig(): AnvilConfig | null {
    return {
      isLargeWidget: false,
      widgetSize: {
        maxHeight: {},
        maxWidth: { base: "360px" },
        minHeight: { base: "40px" },
        minWidth: { base: "120px" },
      },
    };
  }

  static getAutocompleteDefinitions(): AutocompletionDefinitions {
    return {
      "!doc":
        "Filepicker widget is used to allow users to upload files from their local machines to any cloud storage via API. Cloudinary and Amazon S3 have simple APIs for cloud storage uploads",
      "!url": "https://docs.appsmith.com/widget-reference/filepicker",
      isVisible: DefaultAutocompleteDefinitions.isVisible,
      files: "[$__file__$]",
      isDisabled: "bool",
      isValid: "bool",
      isDirty: "bool",
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
            label: "Allowed file types",
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
            label: "Data format",
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
              "Controls if the arrays should try to infer the best possible data type based on the values in CSV file",
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
            label: "Max no. of files",
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
              params: {
                min: 1,
                max: 200,
                default: 5,
                passThroughOnZero: false,
              },
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
            label: "Animate loading",
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
              "when the user selects a file. Upload files to a CDN and stores their URLs in filepicker.files",
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
            label: "Button color",
            controlType: "COLOR_PICKER",
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: false,
            validation: { type: ValidationTypes.TEXT },
          },
        ],
      },
      {
        sectionName: "Border and shadow",
        children: [
          {
            propertyName: "borderRadius",
            label: "Border radius",
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
            label: "Box shadow",
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

  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static getMetaPropertiesMap(): Record<string, any> {
    return {
      selectedFiles: [],
      uploadedFileData: {},
      isDirty: false,
    };
  }

  static getStylesheetConfig(): Stylesheet {
    return {
      buttonColor: "{{appsmith.theme.colors.primaryColor}}",
      borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
      boxShadow: "none",
    };
  }

  /**
   * Import and initialize the Uppy instance. We use memoize() to ensure that
   * once we initialize the instance, we keep returning the initialized one.
   */
  loadAndInitUppyOnce = _.memoize(async () => {
    const { Uppy } = await importUppy();

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

    const uppy = Uppy(uppyState);

    await this.initializeUppyEventListeners(uppy);
    await this.initializeSelectedFiles(uppy);

    return uppy;
  });

  /**
   * set states on the uppy instance with new values
   */
  reinitializeUppy = async (props: FilePickerWidgetProps) => {
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

    const uppy = await this.loadAndInitUppyOnce();

    uppy.setOptions(uppyState);
  };

  /**
   * add all uppy events listeners needed
   */
  initializeUppyEventListeners = async (uppy: Uppy) => {
    const { Dashboard, GoogleDrive, OneDrive, Url, Webcam } =
      await importUppy();

    uppy
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
          const plugin = uppy.getPlugin("Dashboard") as Dashboard;

          if (plugin) {
            plugin.closeModal();
          }

          this.setState({
            isUppyModalOpen: false,
          });
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
      uppy.use(Webcam, {
        onBeforeSnapshot: async () => Promise.resolve(),
        countdown: false,
        mirror: true,
        facingMode: "user",
        locale: {},
      });
    }

    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    uppy.on("file-removed", (file: UppyFile, reason: any) => {
      /**
       * The below line will not update the selectedFiles meta prop when cancel-all event is triggered.
       * cancel-all event occurs when close or reset function of uppy is executed.
       * Uppy provides an argument called reason. It helps us to distinguish on which event the file-removed event was called.
       * Refer to the following issue to know about reason prop: https://github.com/transloadit/uppy/pull/2323
       */
      if (reason === "removed-by-user") {
        const fileCount = this.props.selectedFiles?.length || 0;

        /**
         * We use this.props.selectedFiles to restore the file list that has been read
         */
        const fileMap = this.props.selectedFiles!.reduce((acc, cur) => {
          acc[cur.id] = cur.data;

          return acc;
        }, {});

        /**
         * Once the file is removed we update the selectedFiles
         * with the current files present in the uppy's internal state
         */
        const updatedFiles = uppy
          .getFiles()
          .map((currentFile: UppyFile, index: number) => ({
            type: currentFile.type,
            id: currentFile.id,
            data: fileMap[currentFile.id],
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

    uppy.on("files-added", (files: UppyFile[]) => {
      // Deep cloning the selectedFiles

      const selectedFiles = this.props.selectedFiles
        ? (klonaRegularWithTelemetry(
            this.props.selectedFiles,
            "initializeUppyEventListeners.selectedFiles",
          ) as Array<unknown>)
        : [];

      const fileCount = this.props.selectedFiles?.length || 0;
      const fileReaderPromises = files.map(async (file, index) => {
        return new Promise((resolve) => {
          (async () => {
            let data: unknown;

            if (file.size < FILE_SIZE_LIMIT_FOR_BLOBS) {
              data = await parseFileData(
                file.data,
                this.props.fileDataType,
                file.type || "",
                file.extension,
                this.props.dynamicTyping,
              );
            } else {
              data = createBlobUrl(file.data, this.props.fileDataType);
            }

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
          })();
        });
      });

      Promise.all(fileReaderPromises).then((files) => {
        if (!this.props.isDirty) {
          this.props.updateWidgetMetaProperty("isDirty", true);
        }

        if (selectedFiles.length !== 0) {
          // TODO: Fix this the next time the file is edited
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

    uppy.on("upload", () => {
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

      this.setState({ areFilesLoading: true });
    }
  };

  handleActionComplete = () => {
    this.setState({ areFilesLoading: false });
  };

  async componentDidUpdate(prevProps: FilePickerWidgetProps) {
    super.componentDidUpdate(prevProps);

    const { selectedFiles: previousSelectedFiles = [] } = prevProps;
    const { selectedFiles = [] } = this.props;

    if (previousSelectedFiles.length && selectedFiles.length === 0) {
      (await this.loadAndInitUppyOnce()).reset();
    } else if (
      !shallowequal(prevProps.allowedFileTypes, this.props.allowedFileTypes) ||
      prevProps.maxNumFiles !== this.props.maxNumFiles ||
      prevProps.maxFileSize !== this.props.maxFileSize
    ) {
      await this.reinitializeUppy(this.props);
    }

    this.clearFilesFromMemory(prevProps.selectedFiles);
  }

  // Reclaim the memory used by blobs.
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  clearFilesFromMemory(previousFiles: any[] = []) {
    const { selectedFiles: newFiles = [] } = this.props;

    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

  async initializeSelectedFiles(uppy: Uppy) {
    /**
     * Since on unMount the uppy instance closes and it's internal state is lost along with the files present in it.
     * Below we add the files again to the uppy instance so that the files are retained.
     */
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.props.selectedFiles?.forEach((fileItem: any) => {
      uppy.addFile({
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

  async componentDidMount() {
    super.componentDidMount();

    try {
      await this.loadAndInitUppyOnce();
    } catch (e) {
      log.debug("Error in initializing uppy");
    }
  }

  componentWillUnmount() {
    this.isWidgetUnmounting = true;
    this.loadAndInitUppyOnce().then((uppy) => {
      uppy.close();
    });
  }

  static getSetterConfig(): SetterConfig {
    return {
      __setters: {
        setVisibility: {
          path: "isVisible",
          type: "boolean",
        },
        setDisabled: {
          path: "isDisabled",
          type: "boolean",
        },
      },
    };
  }

  getWidgetView() {
    return (
      <>
        <FilePickerComponent
          borderRadius={this.props.borderRadius}
          boxShadow={this.props.boxShadow}
          buttonColor={this.props.buttonColor}
          files={this.props.selectedFiles || []}
          isDisabled={this.props.isDisabled}
          isLoading={
            this.props.isLoading ||
            this.state.areFilesLoading ||
            this.state.isWaitingForUppyToLoad
          }
          key={this.props.widgetId}
          label={this.props.label}
          maxWidth={this.props.maxWidth}
          minHeight={this.props.minHeight}
          minWidth={this.props.minWidth}
          openModal={async () => {
            // If Uppy is still loading, show a spinner to indicate that handling the click
            // will take some time.
            //
            // Copying the `isUppyLoaded` value because `isUppyLoaded` *will* always be true
            // by the time `await this.initUppyInstanceOnce()` resolves.
            const isUppyLoadedByThisPoint = isUppyLoaded;

            if (!isUppyLoadedByThisPoint)
              this.setState({ isWaitingForUppyToLoad: true });

            const uppy = await this.loadAndInitUppyOnce();

            if (!isUppyLoadedByThisPoint)
              this.setState({ isWaitingForUppyToLoad: false });

            const dashboardPlugin = uppy.getPlugin("Dashboard") as Dashboard;

            dashboardPlugin.openModal();
            this.setState({ isUppyModalOpen: true });
          }}
          shouldFitContent={this.isAutoLayoutMode}
          widgetId={this.props.widgetId}
        />

        {this.state.isUppyModalOpen && (
          <FilePickerGlobalStyles borderRadius={this.props.borderRadius} />
        )}
      </>
    );
  }
}

interface FilePickerWidgetState extends WidgetState {
  areFilesLoading: boolean;
  isWaitingForUppyToLoad: boolean;
  isUppyModalOpen: boolean;
}

interface FilePickerWidgetProps extends WidgetProps {
  label: string;
  maxNumFiles?: number;
  maxFileSize?: number;
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
