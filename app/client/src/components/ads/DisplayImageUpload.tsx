import React, { useEffect, useState } from "react";
import { ReactComponent as ProfileImagePlaceholder } from "assets/images/profile-placeholder.svg";
import Uppy from "@uppy/core";
import Dialog from "components/ads/DialogComponent";

import { Dashboard, useUppy } from "@uppy/react";
import { getTypographyByKey } from "constants/DefaultTheme";

import styled from "styled-components";
import ImageEditor from "@uppy/image-editor";
import { REMOVE, createMessage } from "@appsmith/constants/messages";

import "@uppy/core/dist/style.css";
import "@uppy/dashboard/dist/style.css";
import "@uppy/image-editor/dist/style.css";
import "@blueprintjs/popover2/lib/css/blueprint-popover2.css";

type Props = {
  onChange: (file: File) => void;
  onRemove?: () => void;
  submit: (uppy: Uppy.Uppy) => void;
  value: string;
  label?: string;
};

const Container = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;

  & .input-component {
    display: none;
  }

  & .view {
    cursor: pointer;
    display: flex;
    flex-direction: column;
    align-items: center;

    .image-view {
      width: 80px;
      height: 80px;

      display: flex;
      justify-content: center;
      align-items: center;
      background-color: ${(props) =>
        props.theme.colors.displayImageUpload.background};
      border-radius: 50%;
      margin-bottom: ${(props) => props.theme.spaces[7]}px;

      img {
        height: 100%;
        width: 100%;
        border-radius: 50%;
        object-fit: cover;
      }
    }

    .label {
      ${(props) => getTypographyByKey(props, "h6")}
      color: ${(props) => props.theme.colors.displayImageUpload.label};
    }
  }
`;

const defaultLabel = "Upload Display Picture";

export default function DisplayImageUpload({
  onChange,
  onRemove,
  submit,
  value,
}: Props) {
  const [loadError, setLoadError] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const uppy = useUppy(() => {
    const uppy = Uppy({
      id: "uppy",
      autoProceed: false,
      allowMultipleUploads: false,
      restrictions: {
        maxNumberOfFiles: 1,
        maxFileSize: 3145728, // 3 MB
        allowedFileTypes: [".jpg", ".jpeg", ".png"],
      },
      infoTimeout: 5000,
      locale: {
        strings: {},
      },
    });

    uppy.setOptions({
      locale: {
        strings: {
          cancel: "Cancel",
          done: "Cancel",
        },
      },
    });

    uppy.use(ImageEditor, {
      id: "ImageEditor",
      quality: 0.3,
      cropperOptions: {
        viewMode: 1,
        aspectRatio: 1,
        background: false,
        responsive: true,
        autoCropArea: 0.8,
        autoCrop: true,
      },
      actions: {
        revert: false,
        rotate: false,
        flip: false,
        zoomIn: false,
        zoomOut: false,
        cropSquare: false,
        cropWidescreen: false,
        cropWidescreenVertical: false,
      },
    });

    uppy.on("file-added", (file: File) => {
      onChange(file);
      // TO trigger edit modal
      const dashboard = uppy.getPlugin("uppy-img-upload-dashboard");
      setTimeout(() => {
        (dashboard as any).openFileEditor(file);
      });
    });

    uppy.on("upload", () => {
      submit(uppy);
      setIsModalOpen(false);
    });

    uppy.on("file-editor:complete", (updatedFile) => {
      onChange(updatedFile);
    });

    return uppy;
  });

  useEffect(() => {
    if (value) setLoadError(false);
  }, [value]);

  return (
    <Container onClick={() => setIsModalOpen(true)}>
      <Dialog
        canEscapeKeyClose
        canOutsideClickClose
        className="file-picker-dialog"
        isOpen={isModalOpen}
        trigger={
          <div className="view">
            <div className="image-view">
              {!value || loadError ? (
                <ProfileImagePlaceholder />
              ) : (
                <img
                  onError={() => {
                    setLoadError(true);
                  }}
                  onLoad={() => setLoadError(false)}
                  src={value}
                />
              )}
            </div>
            {(!value || loadError) && (
              <span className="label">{defaultLabel}</span>
            )}
            {value && !loadError && (
              <span
                className="label"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (onRemove) onRemove();
                }}
              >
                {createMessage(REMOVE)}
              </span>
            )}
          </div>
        }
      >
        <Dashboard
          id="uppy-img-upload-dashboard"
          note="File size must not exceed 3 MB"
          plugins={["ImageEditor"]}
          uppy={uppy}
        />
      </Dialog>
    </Container>
  );
}
