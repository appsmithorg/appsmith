import React from "react";
import FilePicker, { CloudinaryUploader, FileType } from "../ads/FilePicker";
import log from "loglevel";

export default {
  title: "FilePicker",
  component: FilePicker,
};

function ShowUploadedFile(data: any) {
  log.debug(data);
}

export const withDynamicProps = () => (
  <FilePicker
    fileType={FileType.IMAGE}
    fileUploader={CloudinaryUploader}
    onFileUploaded={(data) => ShowUploadedFile(data)}
  />
);

export const withJsonInputType = () => (
  <FilePicker
    fileType={FileType.JSON}
    fileUploader={CloudinaryUploader}
    onFileUploaded={(data) => ShowUploadedFile(data)}
  />
);
