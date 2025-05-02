import * as React from "react";
import { useState, useEffect } from "react";
import styled from "styled-components";
import type { ControlProps } from "./BaseControl";
import BaseControl from "./BaseControl";
import type { ControlType } from "constants/PropertyControlConstants";
import type { WrappedFieldInputProps, WrappedFieldMetaProps } from "redux-form";
import { Field, getFormValues } from "redux-form";
import { Button, Tag, Text, toast } from "@appsmith/ads";
import type { DefaultRootState } from "react-redux";
import type { Datasource } from "entities/Datasource";
import type { Action } from "entities/Action";
import { connect } from "react-redux";
import PluginsApi from "api/PluginApi";
import type { Plugin } from "entities/Plugin";
import { get, isArray } from "lodash";
import { formatFileSize } from "./utils";
import { getCurrentWorkspaceId } from "ee/selectors/selectedWorkspaceSelectors";
import { getPlugin } from "ee/selectors/entitiesSelector";
import AnalyticsUtil from "ee/utils/AnalyticsUtil";

const HiddenFileInput = styled.input`
  visibility: hidden;
`;

interface ConnectProps {
  pluginId?: string;
  currentFiles: FileMetadata[];
  workpaceId: string;
  plugin?: Plugin;
}

export type MultipleFilePickerControlProps = ControlProps & {
  allowedFileTypes?: string[];
  maxFileSizeInBytes?: number;
  uploadFilesToTrigger?: boolean;
  pluginId?: string;
  config?: {
    uploadToTrigger?: boolean;
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    params?: Record<string, any>;
  };
  buttonLabel?: string;
} & ConnectProps;

type FilePickerProps = MultipleFilePickerControlProps & {
  input?: WrappedFieldInputProps;
  meta?: WrappedFieldMetaProps;
  disabled?: boolean;
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onChange: (event: any) => void;
  maxUploadSize: number;
};

interface FileMetadata {
  id: string;
  name: string;
  size: number;
  mimetype: string;
  base64Content?: string;
}

export interface FileUploadResponse {
  data: {
    files: {
      id: string;
      name: string;
      size: number;
      mimetype: string;
    }[];
  };
}

function FilePicker(props: FilePickerProps) {
  const {
    buttonLabel = "Select Files",
    config: { params: uploadParams = {}, uploadToTrigger = false } = {},
  } = props;
  const [uploading, setUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<FileMetadata[]>([]);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const uploadFilesToTriggerApi = async (
    files: File[],
  ): Promise<FileMetadata[]> => {
    if (!props.pluginId) return [];

    try {
      const response = await PluginsApi.uploadFiles(props.pluginId, files, {
        ...uploadParams,
        workspaceId: props.workpaceId,
      });

      if ("trigger" in response.data) {
        const {
          data: { files },
        } = response.data.trigger as FileUploadResponse;

        return files;
      } else {
        return [];
      }
    } catch (e) {
      toast.show("Error uploading files", { kind: "error" });

      return [];
    }
  };

  const validateFileSizes = (files: File[]) => {
    const { maxFileSizeInBytes = -1 } = props;

    if (maxFileSizeInBytes === -1) return true;

    let totalSize = 0;

    uploadedFiles.forEach((file) => {
      totalSize += file.size;
    });

    files.forEach((file) => {
      totalSize += file.size;
    });

    if (totalSize > maxFileSizeInBytes) {
      toast.show(
        `Total file sizes execceds the maximum allowed size of ${formatFileSize(
          maxFileSizeInBytes,
        )}`,
        {
          kind: "error",
        },
      );

      AnalyticsUtil.logEvent("MULTI_FILE_PICKER_EXCEEDS_LIMIT", {
        uploadedSize: totalSize,
        allowedSize: maxFileSizeInBytes,
        pluginName: props.plugin?.name,
        pluginId: props.pluginId,
        packageName: props.plugin?.packageName,
      });

      clearInput();

      return false;
    }

    return true;
  };

  const clearInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const getBase64Content = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.readAsDataURL(file);
      reader.onload = () => {
        if (typeof reader.result === "string") {
          resolve(reader.result);
        } else {
          reject();
        }
      };
    });
  };

  const handleFileChange: React.ChangeEventHandler<HTMLInputElement> = async (
    event,
  ) => {
    const files = event.target.files;

    if (!files) return;

    if (files.length === 0) return;

    const filesArray = Array.from(files);

    if (!validateFileSizes(filesArray)) {
      clearInput();

      return;
    }

    setUploading(true);
    let newFiles: FileMetadata[] = [];

    if (uploadToTrigger) {
      newFiles = await uploadFilesToTriggerApi(filesArray);
    } else {
      filesArray.forEach(async (file) => {
        const base64Content = await getBase64Content(file);

        newFiles.push({
          id: file.name,
          name: file.name,
          size: file.size,
          mimetype: file.type,
          base64Content,
        });
      });
    }

    setUploadedFiles((prev) => [...prev, ...newFiles]);
    setUploading(false);
    clearInput();
  };

  const onRemoveFile = (fileId: string) => {
    setUploadedFiles((prev) =>
      prev.filter((uploadedFile) => uploadedFile.id !== fileId),
    );
  };

  useEffect(() => {
    props.input?.onChange(uploadedFiles);
  }, [uploadedFiles]);

  useEffect(() => {
    if (props.currentFiles && props.currentFiles.length > 0) {
      setUploadedFiles(props.currentFiles);
    }
  }, [props.currentFiles]);

  const allowedFileTypesProps = isArray(props.allowedFileTypes)
    ? props.allowedFileTypes.join(",")
    : undefined;

  return (
    <div>
      <div className="flex items-center gap-2">
        <Button
          isDisabled={uploading}
          isLoading={uploading}
          kind="secondary"
          onClick={() => {
            if (fileInputRef.current) {
              fileInputRef.current.click();
            }
          }}
        >
          {buttonLabel}
        </Button>
        <HiddenFileInput
          accept={allowedFileTypesProps}
          multiple
          onChange={handleFileChange}
          ref={fileInputRef}
          type="file"
        />
      </div>
      <div className="flex gap-2 flex-col mt-2">
        {uploadedFiles.map((file) => (
          <Tag
            className="w-max !border-[color:var(--ads-v2\-color-gray-400)]"
            key={file.id}
            onClose={() => {
              onRemoveFile(file.id);
            }}
            size="md"
          >
            <div className="flex items-center">
              <Text
                className="min-w-[120px] max-w-[120px] truncate inline-block mr-2"
                kind="body-s"
              >
                {file.name}
              </Text>
              <Text
                className="min-w-[90px] max-w-[90px] inline-block text-right"
                kind="body-s"
              >
                ({formatFileSize(file.size)})
              </Text>
            </div>
          </Tag>
        ))}
      </div>
    </div>
  );
}

class MultipleFilePickerControl extends BaseControl<MultipleFilePickerControlProps> {
  constructor(props: MultipleFilePickerControlProps) {
    super(props);
    this.state = {
      isOpen: false,
    };
  }

  render() {
    const { configProperty, disabled } = this.props;

    return (
      <Field
        component={FilePicker}
        disabled={disabled}
        name={configProperty}
        props={this.props}
      />
    );
  }

  getControlType(): ControlType {
    return "MULTIPLE_FILE_PICKER";
  }
}

export interface FilePickerComponentState {
  isOpen: boolean;
}

const mapStateToProps = (
  state: DefaultRootState,
  ownProps: MultipleFilePickerControlProps,
): ConnectProps => {
  const formValues: Partial<Action | Datasource> = getFormValues(
    ownProps.formName,
  )(state);

  const currentFiles = get(formValues, ownProps.configProperty, []);
  const pluginId = formValues.pluginId || "";
  const workpaceId = getCurrentWorkspaceId(state);
  const plugin = getPlugin(state, pluginId);

  return { plugin, pluginId, currentFiles, workpaceId };
};

export default connect(mapStateToProps)(MultipleFilePickerControl);
