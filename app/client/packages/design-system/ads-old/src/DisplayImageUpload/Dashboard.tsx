import React from "react";
import Uppy from "@uppy/core";
import { Dashboard as UppyDashboard, useUppy } from "@uppy/react";
import ImageEditor from "@uppy/image-editor";
import "@uppy/core/dist/style.css";
import "@uppy/dashboard/dist/style.css";
import "@uppy/image-editor/dist/style.css";
import "@blueprintjs/popover2/lib/css/blueprint-popover2.css";

interface DashboardProps {
  onChange: (file: File) => void;
  onInvalidFileContent?: () => void;
  submit: (uppy: Uppy.Uppy) => void;
  disableUppyInformer?: boolean;
  onModalCloseRequested: () => void;
}

function Dashboard({
  disableUppyInformer,
  onChange,
  onInvalidFileContent,
  onModalCloseRequested,
  submit,
}: DashboardProps) {
  const uppy = useUppy(() => {
    const uppy = Uppy({
      id: "uppy",
      autoProceed: false,
      allowMultipleUploads: false,
      restrictions: {
        maxNumberOfFiles: 1,
        maxFileSize: 3145728, // 3 MB
        /* Even this doesn't verify file content
        e.g. when you rename a .json to .png and try to upload it */
        allowedFileTypes: ["image/jpg", "image/jpeg", "image/png"],
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
      isFileContentAnImageType(file)
        .then(() => {
          onChange(file);
          // TO trigger edit modal
          const dashboard = uppy.getPlugin("uppy-img-upload-dashboard");
          setTimeout(() => {
            (dashboard as any).openFileEditor(file);
          });
        })
        .catch(() => {
          uppy.removeFile(uppy.getFiles()[0].id);
          onInvalidFileContent?.();
        });
    });

    uppy.on("upload", () => {
      submit(uppy);
      onModalCloseRequested();
    });

    uppy.on("file-editor:complete", (updatedFile) => {
      onChange(updatedFile);
    });

    return uppy;
  });

  return (
    <UppyDashboard
      disableInformer={disableUppyInformer}
      id="uppy-img-upload-dashboard"
      note="File size must not exceed 3 MB"
      plugins={["ImageEditor"]}
      uppy={uppy}
    />
  );
}

export default Dashboard;

const isFileContentAnImageType = async (file: File) => {
  // ref: https://stackoverflow.com/questions/18299806/how-to-check-file-mime-type-with-javascript-before-upload
  return new Promise((resolve, reject) => {
    // get first 4 bytes of the file
    const blob = (file as any).data.slice(0, 4);
    const reader = new FileReader();
    reader.onloadend = () => {
      if (reader.result) {
        // convert content to a unsigned int array to read it's value
        // then toString(16) converts to hexadecimal
        const initialBytesOfFile = new Uint8Array(
          reader.result as ArrayBufferLike,
        ).reduce((prev, curr) => prev + curr.toString(16), "");
        /*
          compare initialBytesOfFile with magic numbers to identify file signature
          file signatures reference: https://en.wikipedia.org/wiki/List_of_file_signatures
        */
        switch (initialBytesOfFile) {
          // image/png
          case "89504e47":
            resolve(true);
            break;
          // image/jpeg or image/jpg
          case "ffd8ffe0":
          case "ffd8ffe1":
          case "ffd8ffdb":
          case "ffd8ffee":
            resolve(true);
            break;
        }
        reject();
      }
    };
    reader.readAsArrayBuffer(blob);
  });
};
