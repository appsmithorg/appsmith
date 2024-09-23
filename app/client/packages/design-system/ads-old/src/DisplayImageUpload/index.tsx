import React, { Suspense, useEffect, useState } from "react";
import Dialog from "../DialogComponent";

import styled from "styled-components";
import {
  REMOVE,
  createMessage,
  DISPLAY_IMAGE_UPLOAD_LABEL,
} from "../constants/messages";

import { getTypographyByKey } from "../constants/typography";

// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import { ReactComponent as ProfileImagePlaceholder } from "../assets/icons/others/profile-placeholder.svg";
import { Spinner } from "@appsmith/ads";

interface Props {
  onChange: (file: File) => void;
  onRemove?: () => void;
  onInvalidFileContent?: () => void;
  // eslint-disable-next-line @typescript-eslint/consistent-type-imports
  submit: (uppy: import("@uppy/core").Uppy) => void;
  value: string;
  label?: string;
  disableUppyInformer?: boolean;
}

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
      background-color: var(--ads-display-image-upload-background-color);
      border-radius: 50%;
      margin-bottom: var(--ads-spaces-7);

      img {
        height: 100%;
        width: 100%;
        border-radius: 50%;
        object-fit: cover;
      }
    }

    .label {
      ${() => getTypographyByKey("h6")}
      color: var(--ads-display-image-upload-label-text-color);
      border-radius: var(--ads-v2-border-radius);
      padding: var(--ads-v2-spaces-2) var(--ads-v2-spaces-3);
      height: 36px;
      display: flex;
      align-items: center;

      &:hover {
        background-color: var(--ads-v2-color-bg-subtle);
      }
    }
  }
`;

const StyledDialog = styled(Dialog)`
  padding: 0 !important;
  .uppy-Dashboard-inner {
    border-color: var(--ads-v2-color-border);
    background-color: var(--ads-v2-color-bg);
  }
  [data-uppy-drag-drop-supported="true"] .uppy-Dashboard-AddFiles {
    border-color: var(--ads-v2-color-border);
  }
  .uppy-Dashboard-AddFiles-title {
    color: var(--ads-v2-color-fg);
  }
  .uppy-size--md .uppy-Dashboard-AddFiles-title {
    font-size: 20px;
  }
  .uppy-Dashboard-browse {
    color: var(--ads-v2-color-fg-brand);
    &:hover,
    &:focus {
      border-color: var(--ads-v2-color-fg-brand);
    }
  }
  .uppy-Dashboard-note {
    color: var(--ads-v2-color-fg-muted);
  }
  a.uppy-Dashboard-poweredBy {
    display: none;
  }
  .uppy-DashboardContent-title {
    color: var(--ads-v2-color-fg-emphasis);
  }
  .uppy-ImageCropper-controls {
    button:hover {
      background-color: var(--ads-v2-color-bg-brand-emphasis);
    }
  }
  .uppy-u-reset,
  .uppy-c-btn {
    border-radius: var(--ads-v2-border-radius);
  }
  .bp3-dialog-body {
    margin-top: 0 !important;
  }
  .cropper-point,
  .cropper-line {
    background-color: var(--ads-v2-color-bg-brand);
  }
  .cropper-view-box {
    outline-color: var(--ads-v2-color-bg-brand);
  }
  .uppy-ImageCropper .cropper-view-box {
    outline-color: var(--ads-v2-color-bg-brand);
  }
  .uppy-ImageCropper-controls {
    border-radius: var(--ads-v2-border-radius);
    background-color: var(--ads-v2-color-bg-brand);
  }
  .uppy-StatusBar.is-waiting .uppy-StatusBar-actions,
  .uppy-DashboardContent-bar {
    background-color: var(--ads-v2-color-bg);
  }
  .uppy-StatusBar:not([aria-hidden="true"]).is-waiting,
  .uppy-DashboardContent-bar {
    border-color: var(--ads-v2-color-border);
  }
  .uppy-StatusBar.is-waiting .uppy-StatusBar-actionBtn--upload {
    background-color: var(--ads-v2-color-bg-brand);
    &:hover,
    &:focus {
      background-color: var(--ads-v2-color-bg-brand-emphasis);
    }
  }
  .uppy-DashboardContent-back,
  .uppy-DashboardContent-save {
    color: var(--ads-v2-color-fg);
    &:hover,
    &:focus {
      background-color: var(--ads-v2-color-bg-subtle);
    }
  }
  .cropper-view-box {
    box-shadow: 0 0 0 1px var(--ads-v2-color-bg-brand);
  }
  .uppy-Dashboard-Item-action--remove {
    color: var(--ads-v2-color-bg-emphasis-max);
  }
`;

const SpinnerContainer = styled.div`
  // Setting a concrete width and height to match the dashboard’s width and height
  // and prevent a big layout jump when the dashboard loads
  width: 750px;
  height: 550px;
  max-width: 100%;
  max-height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
`;

// Dashboard is code-split away to avoid bundling Uppy in the main bundle
const DashboardLazy = React.lazy(async () => {
  await new Promise((resolve) => setTimeout(resolve, 10000));

  return import("./Dashboard");
});

export default function DisplayImageUpload({
  disableUppyInformer,
  onChange,
  onInvalidFileContent,
  onRemove,
  submit,
  value,
}: Props) {
  const [loadError, setLoadError] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (value) setLoadError(false);
  }, [value]);

  return (
    <Container onClick={() => setIsModalOpen(true)}>
      <StyledDialog
        canEscapeKeyClose
        canOutsideClickClose
        className="file-picker-dialog"
        isOpen={isModalOpen}
        trigger={
          <div className="view">
            <div className="image-view">
              {!value || loadError ? (
                <ProfileImagePlaceholder style={{ width: "35px" }} />
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
              <span className="label">
                {createMessage(DISPLAY_IMAGE_UPLOAD_LABEL)}
              </span>
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
        <Suspense
          fallback={
            <SpinnerContainer>
              <Spinner size="lg" />
            </SpinnerContainer>
          }
        >
          <DashboardLazy
            disableUppyInformer={disableUppyInformer}
            onChange={onChange}
            onInvalidFileContent={onInvalidFileContent}
            onModalCloseRequested={() => setIsModalOpen(false)}
            submit={submit}
          />
        </Suspense>
      </StyledDialog>
    </Container>
  );
}
