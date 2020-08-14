import React from "react";
import FilePicker from "../ads/FilePicker";

export default {
  title: "FilePicker",
  component: FilePicker,
};

function ShowUploadedFile(data: any) {
  console.log(data);
}

export const withDynamicProps = () => (
  <FilePicker onFileUploaded={data => ShowUploadedFile(data)} />
);
