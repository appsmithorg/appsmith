import React, { useEffect, useRef, useState } from "react";
import styled from "styled-components";
import Button, { Category, Size } from "./Button";
import { ReactComponent as UploadIcon } from "../../assets/icons/ads/upload-v2.svg";
import { ReactComponent as UploadSuccessIcon } from "../../assets/icons/ads/upload_success.svg";
import { DndProvider, useDrop, DropTargetMonitor } from "react-dnd";
import HTML5Backend, { NativeTypes } from "react-dnd-html5-backend";
import Text, { TextType } from "./Text";
import { Variant } from "./common";
import { Toaster } from "./Toast";
import {
  createMessage,
  ERROR_FILE_TOO_LARGE,
  REMOVE_FILE_TOOL_TIP,
} from "@appsmith/constants/messages";
import TooltipComponent from "components/ads/Tooltip";
import { Position } from "@blueprintjs/core/lib/esm/common/position";
import Icon, { IconSize } from "./Icon";
import {
  ContainerDiv,
  FileEndings,
  FileType,
  FilePickerProps,
} from "./FilePicker";

const ContainerDivWithBorder = styled(ContainerDiv)<{
  isUploaded: boolean;
  isActive: boolean;
  canDrop: boolean;
  fileType: FileType;
}>`
  width: 100%;
  height: 188px;
  background-image: url("data:image/svg+xml,%3csvg width='100%25' height='100%25' xmlns='http://www.w3.org/2000/svg'%3e%3crect width='100%25' height='100%25' fill='none' stroke='%23F86A2B' stroke-width='1.2' stroke-dasharray='6.4%2c 6.4' stroke-dashoffset='0' stroke-linecap='square'/%3e%3c/svg%3e");
  background-color: ${(props) => props.theme.colors.homepageBackground};
`;

const IconWrapper = styled.div`
  width: ${(props) => props.theme.spaces[9]}px;
  padding-left: ${(props) => props.theme.spaces[2]}px;
`;

function FilePickerComponent(props: FilePickerProps) {
  const { fileType, logoUploadError } = props;
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
    props.onFileUploaded && props.onFileUploaded(url);
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
    props.fileUploader && props.fileUploader(file, setProgress, onUpload);
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
      props.fileUploader && props.fileUploader(file, setProgress, onUpload);
    } else {
      Toaster.show({
        text: createMessage(ERROR_FILE_TOO_LARGE, "250 KB"),
        variant: Variant.warning,
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
      props.onFileRemoved && props.onFileRemoved();
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
      <UploadIcon />
      <Text className="drag-drop-text" type={TextType.P2}>
        Drag & Drop files to upload or
      </Text>
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
        <Button
          category={Category.tertiary}
          onClick={(el) => ButtonClick(el)}
          size={Size.medium}
          text="Browse"
        />
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
        <Button
          category={Category.tertiary}
          icon="delete"
          onClick={() => removeFile()}
          size={Size.medium}
          text="remove"
        />
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
            Successfully Uploaded!
          </Text>
          <TooltipComponent
            content={REMOVE_FILE_TOOL_TIP()}
            position={Position.TOP}
          >
            <IconWrapper className="icon-wrapper" onClick={() => removeFile()}>
              <Icon name="close" size={IconSize.XL} />
            </IconWrapper>
          </TooltipComponent>
        </div>
      </div>
    </div>
  );

  return (
    <ContainerDivWithBorder
      canDrop={canDrop}
      fileType={fileType}
      isActive={isActive}
      isUploaded={isUploaded}
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
