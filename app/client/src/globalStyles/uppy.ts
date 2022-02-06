import { createGlobalStyle } from "styled-components";

export const UppyStyles = createGlobalStyle`
  .uppy-Root .uppy-ImageCropper .uppy-u-reset.uppy-c-btn:first-child  {
    width: 100px;
  }

  a.uppy-Dashboard-poweredBy {
    display: none;
  }

  .bp3-dialog.file-picker-dialog {
    margin: 48px 0;
  }

  .cropper-view-box {
    box-shadow: 0 0 0 1px #39f;
    border-radius: 50%;
    outline: 0;
  }
  .cropper-face {
    background-color:inherit !important;
  }
  .cropper-view-box {
    outline:inherit !important;
  }
`;
