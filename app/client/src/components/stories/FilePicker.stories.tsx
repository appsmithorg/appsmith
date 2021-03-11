import React from "react";
import FilePicker, { CloudinaryUploader } from "../ads/FilePicker";

export default {
  title: "FilePicker",
  component: FilePicker,
};

function ShowUploadedFile(data: any) {
  console.log(data);
}

export const withDynamicProps = () => (
  <FilePicker
    fileUploader={CloudinaryUploader}
    onFileUploaded={(data) => ShowUploadedFile(data)}
  />
);
