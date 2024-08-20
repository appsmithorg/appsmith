import React, { useEffect, useRef, useState } from "react";
import styled from "styled-components";
import type { DropTargetMonitor } from "react-dnd";
import { DndProvider, useDrop } from "react-dnd";
import HTML5Backend, { NativeTypes } from "react-dnd-html5-backend";
import { Button } from "@appsmith/ads";
import type { IconNames } from "@appsmith/ads";
import { Icon } from "@appsmith/ads";
import Text, { TextType } from "../Text";
import { toast } from "@appsmith/ads";
import TooltipComponent from "../Tooltip";
import {
  createMessage,
  ERROR_FILE_TOO_LARGE,
  REMOVE_FILE_TOOL_TIP,
} from "../constants/messages";
import { importSvg } from "../utils/icon-loadables";

const UploadSuccessIcon = importSvg(
  async () => import("../assets/icons/ads/upload_success.svg"),
);

export const FileEndings = {
  IMAGE: ".jpeg,.png,.svg",
  JSON: ".json",
  TEXT: ".txt",
  ANY: "*",
};

export enum FileType {
  IMAGE = "IMAGE",
  JSON = "JSON",
  TEXT = "TEXT",
  ANY = "ANY",
}

export type SetProgress = (percentage: number) => void;
export type UploadCallback = (url: string) => void;
export type FileUploader = (
  file: any,
  setProgress: SetProgress,
  onUpload: UploadCallback,
) => void;

export interface FilePickerProps {
  onFileUploaded?: (fileUrl: string) => void;
  onFileRemoved?: () => void;
  fileUploader?: FileUploader;
  url?: string;
  logoUploadError?: string;
  fileType: FileType;
  delayedUpload?: boolean;
  uploadIcon?: IconNames;
  title?: string;
  description?: string;
  containerClickable?: boolean; // when container is clicked, it'll work as button
  iconFillColor?: string;
}

export const ContainerDiv = styled.div<{
  isUploaded: boolean;
  isActive: boolean;
  canDrop: boolean;
  fileType: FileType;
}>`
  width: 320px;
  height: 190px;
  background-color: var(--ads-file-picker-v2-default-background-color);
  position: relative;

  #fileInput {
    display: none;
  }

  .drag-drop-text {
    margin: var(--ads-spaces-6) 0 var(--ads-spaces-6) 0;
    color: var(--ads-file-picker-v2-default-text-color);
  }

  .upload-form-container {
    width: 100%;
    height: 100%;
    display: grid;
    place-items: center;
    background-repeat: no-repeat;
    background-position: center;
    background-size: contain;
    background-origin: content-box;
    padding: 8px;
  }

  .centered {
    justify-content: center;
    flex-direction: column;
    align-items: center;

    .success-container {
      display: flex;
      align-items: center;
      .success-icon {
        margin-right: var(--ads-spaces-4);
      }

      .success-text {
        color: var(--ads-file-picker-v2-success-text-color);
        margin-right: var(--ads-spaces-4);
      }
    }
  }

  .file-description {
    width: 95%;
    margin: 0 auto;
    margin-top: ${(props) =>
      props.fileType === FileType.IMAGE ? "auto" : "0px"};
    margin-bottom: calc(var(--ads-spaces-6) + 1px);
    display: none;
  }

  .file-spec {
    margin-bottom: var(--ads-spaces-3);
    span {
      margin-right: var(--ads-spaces-4);
    }
  }

  .progress-container {
    width: 100%;
    background: var(--ads-file-picker-v2-upload-progress-background-color);
    transition: height 0.2s;
    border-radius: var(--ads-v2-border-radius);
  }

  .progress-inner {
    background-color: var(--ads-file-picker-v2-upload-success-background-color);
    transition: width 0.4s ease;
    height: var(--ads-spaces-1);
    border-radius: var(--ads-v2-border-radius);
    width: 0%;
  }

  .button-wrapper {
    display: flex;
    flex-direction: column;
    align-items: center;
    .browse-button {
      text-transform: capitalize;
      border-radius: var(--ads-v2-border-radius);
      color: var(--ads-v2-color-fg);
      border-color: var(--ads-v2-color-border);
      background: var(--ads-v2-color-bg);
      &:hover {
        background: var(--ads-v2-color-bg-subtle);
      }
    }
  }

  .remove-button {
    display: none;
    position: absolute;
    bottom: 0;
    right: 0;
    width: 100%;
    .overlay {
      background: var(--ads-v2-color-fg);
      opacity: 0.6;
      position: absolute;
      left: 0;
      right: 0;
      top: 0;
      bottom: 0;
      border-radius: 0 0 var(--ads-v2-border-radius) var(--ads-v2-border-radius);
    }
    .ads-v2-button {
      width: 110px;
      margin: var(--ads-spaces-13) var(--ads-spaces-3) var(--ads-spaces-3) auto;
      display: flex;
    }
  }

  &:hover {
    .remove-button {
      display: ${(props) => (props.isUploaded ? "block" : "none")};
    }
  }
`;

const ContainerDivWithBorder = styled(ContainerDiv)<{
  isUploaded: boolean;
  isActive: boolean;
  canDrop: boolean;
  fileType: FileType;
}>`
  width: 100%;
  height: 188px;
  border-radius: var(--ads-v2-border-radius);
  border: 1px dashed var(--ads-v2-color-border);
  background-color: var(--ads-v2-color-bg);
`;

const IconWrapper = styled.div`
  width: var(--ads-spaces-9);
  padding-left: var(--ads-spaces-2);
`;

const UploadIconWrapper = styled.div`
  svg {
    width: 55px;
    height: 55px;
  }
`;

function FilePickerComponent(props: FilePickerProps) {
  const {
    fileType,
    fileUploader,
    logoUploadError,
    onFileRemoved,
    onFileUploaded,
  } = props;
  const [fileInfo, setFileInfo] = useState<{ name: string; size: number }>({
    name: "",
    size: 0,
  });
  const [isUploaded, setIsUploaded] = useState<boolean>(false);
  const [fileUrl, setFileUrl] = useState("");

  const [{ canDrop, isOver }, drop] = useDrop({
    accept: [NativeTypes.FILE],
    drop(item, monitor) {
      onDrop(monitor);
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  });

  const inputRef = useRef<HTMLInputElement>(null);
  const bgRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const fileDescRef = useRef<HTMLDivElement>(null);
  const fileContainerRef = useRef<HTMLDivElement>(null);

  // when click container, it'll be work as browser button
  function onContainerClick() {
    if (props.containerClickable && inputRef.current) {
      inputRef.current.click();
    }
  }

  function ButtonClick(event: React.MouseEvent<HTMLElement>) {
    event.preventDefault();
    if (inputRef.current) {
      inputRef.current.click();
    }
  }

  function onDrop(monitor: DropTargetMonitor) {
    if (monitor) {
      const files = monitor.getItem().files;
      if (!files) {
        return;
      }
      handleFileUpload(files);
    }
  }

  function setProgress(uploadPercentage: number) {
    if (progressRef.current) {
      progressRef.current.style.width = `${uploadPercentage}%`;
    }
    if (uploadPercentage === 100) {
      setIsUploaded(true);
      if (fileDescRef.current && bgRef.current && fileType === FileType.IMAGE) {
        fileDescRef.current.style.display = "none";
        bgRef.current.style.opacity = "1";
      }
    }
  }

  function onUpload(url: string) {
    onFileUploaded && onFileUploaded(url);
  }

  function handleFileUpload(files: FileList | null) {
    if (fileType === FileType.IMAGE) {
      handleImageFileUpload(files);
    } else {
      handleOtherFileUpload(files);
    }
  }

  function handleOtherFileUpload(files: FileList | null) {
    const file = files && files[0];
    let fileSize = 0;
    if (!file) {
      return;
    }
    fileSize = Math.floor(file.size / 1024);
    setFileInfo({ name: file.name, size: fileSize });
    if (props.delayedUpload) {
      setIsUploaded(true);
      setProgress(100);
    }
    if (fileDescRef.current) {
      fileDescRef.current.style.display = "flex";
    }
    if (fileContainerRef.current) {
      fileContainerRef.current.style.display = "none";
    }
    fileUploader && fileUploader(file, setProgress, onUpload);
  }

  function handleImageFileUpload(files: FileList | null) {
    const file = files && files[0];
    let fileSize = 0;

    if (!file) {
      return;
    }
    fileSize = Math.floor(file.size / 1024);
    setFileInfo({ name: file.name, size: fileSize });

    if (fileSize < 250) {
      if (bgRef.current) {
        bgRef.current.style.backgroundImage = `url(${URL.createObjectURL(
          file,
        )})`;
        bgRef.current.style.opacity = "0.5";
      }
      if (fileDescRef.current) {
        fileDescRef.current.style.display = "block";
      }
      if (fileContainerRef.current) {
        fileContainerRef.current.style.display = "none";
      }

      /* set form data and send api request */
      fileUploader && fileUploader(file, setProgress, onUpload);
    } else {
      toast.show(createMessage(ERROR_FILE_TOO_LARGE, "250 KB"), {
        kind: "warning",
      });
    }
  }

  function removeFile() {
    if (fileContainerRef.current) {
      setFileUrl("");
      if (fileDescRef.current) {
        fileDescRef.current.style.display = "none";
      }
      fileContainerRef.current.style.display = "flex";
      if (bgRef.current) {
        bgRef.current.style.backgroundImage = "url('')";
      }
      setIsUploaded(false);
      onFileRemoved && onFileRemoved();
    }
  }

  const isActive = canDrop && isOver;

  useEffect(() => {
    if (props.url) {
      const urlKeys = props.url.split("/");
      if (urlKeys[urlKeys.length - 1] !== "null") {
        setFileUrl(props.url);
      } else {
        setFileUrl("");
      }
    }
  }, [props.url]);

  // Following hook should be used only if file type is image.
  useEffect(() => {
    if (fileUrl && !isUploaded && fileType === FileType.IMAGE) {
      setIsUploaded(true);
      if (bgRef.current) {
        bgRef.current.style.backgroundImage = `url(${fileUrl})`;
        bgRef.current.style.opacity = "1";
      }
      if (fileDescRef.current) {
        fileDescRef.current.style.display = "none";
      }
      if (fileContainerRef.current) {
        fileContainerRef.current.style.display = "none";
      }
    }
  }, [fileUrl, logoUploadError]);

  // <UploadSuccessIcon />

  const uploadFileForm = (
    <div className="button-wrapper" ref={fileContainerRef}>
      <UploadIconWrapper>
        <Icon
          color={
            props.iconFillColor ||
            "var(--ads-file-picker-v2-upload-icon-fill-color)"
          }
          name={props.uploadIcon || "upload-cloud"}
        />
      </UploadIconWrapper>
      <Text className="drag-drop-text" type={TextType.P2}>
        {props.title || "Drag & drop files to upload or"}
      </Text>
      {props.description && (
        <Text className="drag-drop-description" type={TextType.P2}>
          {props.description}
        </Text>
      )}
      <form>
        <input
          accept={FileEndings[fileType]}
          id="fileInput"
          multiple={false}
          onChange={(el) => handleFileUpload(el.target.files)}
          ref={inputRef}
          type="file"
          value={""}
        />
        {!props.containerClickable && (
          <Button
            className="browse-button"
            kind="secondary"
            onClick={(el: React.MouseEvent<HTMLElement>) => ButtonClick(el)}
            size="sm"
          >
            Browse
          </Button>
        )}
      </form>
    </div>
  );

  const uploadStatus = (
    <div className="file-spec">
      <Text type={TextType.P1}>{fileInfo.name}</Text>
      <Text type={TextType.P1}>{fileInfo.size}KB</Text>
    </div>
  );

  const imageUploadComponent = (
    <>
      <div className="upload-form-container" ref={bgRef}>
        {uploadFileForm}
        <div className="file-description" id="fileDesc" ref={fileDescRef}>
          {uploadStatus}
          <div className="progress-container">
            <div className="progress-inner" ref={progressRef} />
          </div>
        </div>
      </div>
      <div className="remove-button">
        <div className="overlay" />
        <Button
          data-testid="t--remove-logo"
          kind="secondary"
          onClick={() => removeFile()}
          size="sm"
          startIcon="delete"
        >
          Remove
        </Button>
      </div>
    </>
  );

  const uploadComponent = (
    <div className="upload-form-container">
      {uploadFileForm}
      <div
        className="file-description centered"
        id="fileDesc"
        ref={fileDescRef}
      >
        {uploadStatus}
        <div className="success-container">
          <UploadSuccessIcon className="success-icon" />
          <Text className="success-text" type={TextType.H4}>
            Successfully uploaded!
          </Text>
          <TooltipComponent content={REMOVE_FILE_TOOL_TIP()} position="top">
            <IconWrapper className="icon-wrapper" onClick={() => removeFile()}>
              <Icon name="close" size="lg" />
            </IconWrapper>
          </TooltipComponent>
        </div>
      </div>
    </div>
  );

  return (
    <ContainerDivWithBorder
      canDrop={canDrop}
      className="upload-form-container-box"
      fileType={fileType}
      isActive={isActive}
      isUploaded={isUploaded}
      onClick={onContainerClick}
      ref={drop}
    >
      {fileType === FileType.IMAGE ? imageUploadComponent : uploadComponent}
    </ContainerDivWithBorder>
  );
}

function FilePickerV2(props: FilePickerProps) {
  return (
    <DndProvider backend={HTML5Backend}>
      <FilePickerComponent {...props} />
    </DndProvider>
  );
}

export default FilePickerV2;
