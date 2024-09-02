import type { Uppy } from "@uppy/core";
import type Dashboard from "@uppy/dashboard";
import type {
  AutocompletionDefinitions,
  PropertyUpdates,
  SnipingModeProperty,
  WidgetCallout,
} from "WidgetProvider/constants";
import type { DerivedPropertiesMap } from "WidgetProvider/factory";
import { EventType } from "constants/AppsmithActionConstants/ActionConstants";
import { WIDGET_TAGS } from "constants/WidgetConstants";
import { ValidationTypes } from "constants/WidgetValidation";
import type { SetterConfig } from "entities/AppTheming";
import { EvaluationSubstitutionType } from "entities/DataTree/dataTreeFactory";
import _ from "lodash";
import log from "loglevel";
import { buildDeprecationWidgetMessage } from "pages/Editor/utils";
import React from "react";
import shallowequal from "shallowequal";
import { importUppy, isUppyLoaded } from "utils/importUppy";
import { DefaultAutocompleteDefinitions } from "widgets/WidgetUtils";
import type { WidgetProps, WidgetState } from "../../BaseWidget";
import BaseWidget from "../../BaseWidget";
import FilePickerComponent from "../component";
import IconSVG from "../icon.svg";
import FileDataTypes from "./FileDataTypes";

class FilePickerWidget extends BaseWidget<
  FilePickerWidgetProps,
  FilePickerWidgetState
> {
  constructor(props: FilePickerWidgetProps) {
    super(props);
    this.state = {
      areFilesLoading: false,
      isWaitingForUppyToLoad: false,
    };
  }

  static type = "FILE_PICKER_WIDGET";

  static getConfig() {
    return {
      name: "FilePicker",
      iconSVG: IconSVG,
      needsMeta: true,
      hideCard: true,
      isDeprecated: true,
      replacement: "FILE_PICKER_WIDGET_V2",
      tags: [WIDGET_TAGS.INPUTS],
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
      widgetName: "FilePicker",
      isDefaultClickDisabled: true,
      version: 1,
      isRequired: false,
      isDisabled: false,
      animateLoading: true,
    };
  }

  static getMethods() {
    return {
      getSnipingModeUpdates: (
        propValueMap: SnipingModeProperty,
      ): PropertyUpdates[] => {
        return [
          {
            propertyPath: "onFilesSelected",
            propertyValue: propValueMap.run,
            isDynamicPropertyPath: true,
          },
        ];
      },
      getEditorCallouts(): WidgetCallout[] {
        return [
          {
            message: buildDeprecationWidgetMessage(
              FilePickerWidget.getConfig().name,
            ),
          },
        ];
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
            label: "Allowed file types",
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
            label: "Data format",
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
  static getDefaultPropertiesMap(): Record<string, string> {
    return {};
  }
  static getDerivedPropertiesMap(): DerivedPropertiesMap {
    return {
      isValid: `{{ this.isRequired ? this.files.length > 0 : true }}`,
      files: `{{this.selectedFiles.map((file) => { return { ...file, data: this.fileDataType === "Base64" ? file.base64 : this.fileDataType === "Binary" ? file.raw : file.text } })}}`,
    };
  }

  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static getMetaPropertiesMap(): Record<string, any> {
    return {
      selectedFiles: [],
      uploadedFileData: {},
    };
  }

  /**
   * Import and initialize the Uppy instance. We use memoize() to ensure that
   * once we initialize the instance, we keep returning it.
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
    uppy.on("file-removed", (file: any) => {
      const updatedFiles = this.props.selectedFiles
        ? this.props.selectedFiles.filter((dslFile) => {
            return file.id !== dslFile.id;
          })
        : [];
      this.props.updateWidgetMetaProperty("selectedFiles", updatedFiles);
    });

    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    uppy.on("files-added", (files: any[]) => {
      const dslFiles = this.props.selectedFiles
        ? [...this.props.selectedFiles]
        : [];
      const fileReaderPromises = files.map(async (file) => {
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
      super.executeAction({
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
    if (
      prevProps.selectedFiles &&
      prevProps.selectedFiles.length > 0 &&
      this.props.selectedFiles === undefined
    ) {
      (await this.loadAndInitUppyOnce()).reset();
    } else if (
      !shallowequal(prevProps.allowedFileTypes, this.props.allowedFileTypes) ||
      prevProps.maxNumFiles !== this.props.maxNumFiles ||
      prevProps.maxFileSize !== this.props.maxFileSize
    ) {
      await this.reinitializeUppy(this.props);
    }
  }

  async componentDidMount() {
    try {
      await this.loadAndInitUppyOnce();
    } catch (e) {
      log.debug("Error in initializing uppy");
    }
  }

  componentWillUnmount() {
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
      <FilePickerComponent
        closeModal={async () => {
          const uppy = await this.loadAndInitUppyOnce();

          const dashboardPlugin = uppy.getPlugin("Dashboard") as Dashboard;
          dashboardPlugin.closeModal();
        }}
        files={this.props.selectedFiles || []}
        isDisabled={this.props.isDisabled}
        isLoading={
          this.props.isLoading ||
          this.state.areFilesLoading ||
          this.state.isWaitingForUppyToLoad
        }
        key={this.props.widgetId}
        label={this.props.label}
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
        }}
        widgetId={this.props.widgetId}
      />
    );
  }
}

export interface FilePickerWidgetState extends WidgetState {
  areFilesLoading: boolean;
  isWaitingForUppyToLoad: boolean;
}

export interface FilePickerWidgetProps extends WidgetProps {
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
}

export default FilePickerWidget;
