import React, { useEffect, useRef, useState } from "react";
import styled from "styled-components";
import Button, { Category, Size } from "./Button";
import axios from "axios";
import { ReactComponent as UploadIcon } from "../../assets/icons/ads/upload.svg";
import { DndProvider, useDrop, DropTargetMonitor } from "react-dnd";
import HTML5Backend, { NativeTypes } from "react-dnd-html5-backend";
import Text, { TextType } from "./Text";
import { Classes, Variant } from "./common";
import { Toaster } from "./Toast";
import { createMessage, ERROR_FILE_TOO_LARGE } from "constants/messages";

const CLOUDINARY_PRESETS_NAME = "";
const CLOUDINARY_CLOUD_NAME = "";

type FilePickerProps = {
  onFileUploaded?: (fileUrl: string) => void;
  onFileRemoved?: () => void;
  fileUploader?: FileUploader;
  url?: string;
  logoUploadError?: string;
};

const ContainerDiv = styled.div<{
  isUploaded: boolean;
  isActive: boolean;
  canDrop: boolean;
}>`
  width: 320px;
  height: 190px;
  background-color: ${(props) => props.theme.colors.filePicker.bg};
  position: relative;

  #fileInput {
    display: none;
  }

  .drag-drop-text {
    margin: ${(props) => props.theme.spaces[6]}px 0
      ${(props) => props.theme.spaces[6]}px 0;
    color: ${(props) => props.theme.colors.filePicker.color};
  }

  .bg-image {
    width: 100%;
    height: 100%;
    display: grid;
    place-items: center;
    background-repeat: no-repeat;
    background-position: center;
    background-size: contain;
  }

  .file-description {
    width: 95%;
    margin-top: auto;
    margin-bottom: ${(props) => props.theme.spaces[6] + 1}px;
    display: none;
  }

  .file-spec {
    margin-bottom: ${(props) => props.theme.spaces[2]}px;
    span {
      margin-right: ${(props) => props.theme.spaces[4]}px;
    }
  }

  .progress-container {
    width: 100%;
    background: ${(props) => props.theme.colors.filePicker.progress};
    transition: height 0.2s;
  }

  .progress-inner {
    background-color: ${(props) => props.theme.colors.success.light};
    transition: width 0.4s ease;
    height: ${(props) => props.theme.spaces[1]}px;
    border-radius: ${(props) => props.theme.spaces[1] - 1}px;
    width: 0%;
  }

  .button-wrapper {
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .remove-button {
    display: none;
    position: absolute;
    bottom: 0;
    right: 0;
    background: linear-gradient(
      180deg,
      ${(props) => props.theme.colors.filePicker.shadow.from},
      ${(props) => props.theme.colors.filePicker.shadow.to}
    );
    opacity: 0.6;
    width: 100%;

    a {
      width: 110px;
      margin: ${(props) => props.theme.spaces[13]}px
        ${(props) => props.theme.spaces[3]}px
        ${(props) => props.theme.spaces[3]}px auto;
      .${Classes.ICON} {
        margin-right: ${(props) => props.theme.spaces[2] - 1}px;
      }
    }
  }

  &:hover {
    .remove-button {
      display: ${(props) => (props.isUploaded ? "block" : "none")};
    }
  }
`;

export type SetProgress = (percentage: number) => void;
export type UploadCallback = (url: string) => void;
export type FileUploader = (
  file: any,
  setProgress: SetProgress,
  onUpload: UploadCallback,
) => void;

export function CloudinaryUploader(
  file: any,
  setProgress: SetProgress,
  onUpload: UploadCallback,
) {
  const formData = new FormData();
  formData.append("upload_preset", CLOUDINARY_PRESETS_NAME);
  if (file) {
    formData.append("file", file);
  }
  axios
    .post(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        onUploadProgress: function(progressEvent: ProgressEvent) {
          const uploadPercentage = Math.round(
            (progressEvent.loaded / progressEvent.total) * 100,
          );
          setProgress(uploadPercentage);
        },
      },
    )
    .then((data) => {
      onUpload(data.data.url);
    })
    .catch((error) => {
      console.error("error in file uploading", error);
    });
}

const FilePickerComponent = (props: FilePickerProps) => {
  const { logoUploadError } = props;
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
      if (files) {
        handleFileUpload(files);
      }
    }
  }

  function setProgress(uploadPercentage: number) {
    if (progressRef.current) {
      progressRef.current.style.width = `${uploadPercentage}%`;
    }
    if (uploadPercentage === 100) {
      setIsUploaded(true);
      if (fileDescRef.current && bgRef.current) {
        fileDescRef.current.style.display = "none";
        bgRef.current.style.opacity = "1";
      }
    }
  }

  function onUpload(url: string) {
    props.onFileUploaded && props.onFileUploaded(url);
  }

  function handleFileUpload(files: FileList | null) {
    const file = files && files[0];
    let fileSize = 0;

    if (file) {
      fileSize = Math.floor(file.size / 1024);
      setFileInfo({ name: file.name, size: fileSize });
    }

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
    if (fileContainerRef.current && bgRef.current) {
      setFileUrl("");
      fileContainerRef.current.style.display = "flex";
      bgRef.current.style.backgroundImage = "url('')";
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

  useEffect(() => {
    if (fileUrl && !isUploaded) {
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

  return (
    <ContainerDiv
      isActive={isActive}
      canDrop={canDrop}
      isUploaded={isUploaded}
      ref={drop}
    >
      <div ref={bgRef} className="bg-image">
        <div className="button-wrapper" ref={fileContainerRef}>
          <UploadIcon />
          <Text type={TextType.P2} className="drag-drop-text">
            Drag & Drop files to upload or
          </Text>
          <form>
            <input
              type="file"
              id="fileInput"
              multiple={false}
              ref={inputRef}
              accept=".jpeg,.png,.svg"
              value={""}
              onChange={(el) => handleFileUpload(el.target.files)}
            />
            <Button
              text="Browse"
              category={Category.tertiary}
              size={Size.medium}
              onClick={(el) => ButtonClick(el)}
            />
          </form>
        </div>
        <div className="file-description" ref={fileDescRef} id="fileDesc">
          <div className="file-spec">
            <Text type={TextType.H6}>{fileInfo.name}</Text>
            <Text type={TextType.H6}>{fileInfo.size}KB</Text>
          </div>
          <div className="progress-container">
            <div className="progress-inner" ref={progressRef}></div>
          </div>
        </div>
      </div>
      <div className="remove-button">
        <Button
          text="remove"
          icon="delete"
          size={Size.medium}
          category={Category.tertiary}
          onClick={() => removeFile()}
        />
      </div>
    </ContainerDiv>
  );
};

const FilePicker = (props: FilePickerProps) => {
  return (
    <DndProvider backend={HTML5Backend}>
      <FilePickerComponent {...props} />
    </DndProvider>
  );
};

export default FilePicker;
