import React from "react";
import FilePicker, { CloudinaryUploader } from "../alloy/FilePicker";

export default {
  title: "FilePicker",
  component: FilePicker,
};

function ShowUploadedFile(data: any) {
  console.log(data);
}

export const withDynamicProps = () => (
  <FilePicker
    onFileUploaded={(data) => ShowUploadedFile(data)}
    fileUploader={CloudinaryUploader}
  />
);
