import React, { useMemo } from "react";
import Uppy from "@uppy/core";
import FileInput from "@uppy/file-input";
import ProgressBar from "@uppy/progress-bar";
import "@uppy/core/dist/style.css";
import "@uppy/dashboard/dist/style.css";
import styled from "styled-components";
// import Tus from '@uppy/tus'

const StyledDiv = styled("div")`
  /* height: 190px;
    width: 320px; */
  height: 100%;
  width: 100%;
  opacity: 0.8;
  background-color: #232324;
  display: grid;
  place-items: center;
`;

function FilePicker(props: any) {
  const uppy = useMemo(() => {
    return Uppy({
      id: "uppy12",
      autoProceed: true,
      restrictions: {
        maxNumberOfFiles: 1,
        // allowedFileTypes: ['image/*', '.jpg', '.jpeg', '.png']
      },
    });
    // .use(FileInput, {
    //     target: '.UppyForm',
    //     inputName: 'files[]',
    //     replaceTargetContent: true,
    //     pretty: true
    // })
    // .use(ProgressBar, {
    //     target: '.UppyProgressBar',
    //     hideAfterFinish: false
    // })
  }, []);

  uppy.on("complete", result => {
    console.log("successful files:", result.successful);
    console.log("failed files:", result.failed);
  });

  React.useEffect(() => {
    return () => uppy.close();
  }, []);

  return (
    <div>
      <div className="UppyForm">
        <form>
          <h5>
            Uppy was not loaded — slow connection, unsupported browser, weird JS
            error on a page — but the upload still works, because HTML is cool
            like that
          </h5>
          <input type="file" name="files" multiple={false} />
          <button type="submit">Fallback Form Upload</button>
        </form>
      </div>
      <div className="UppyProgressBar"></div>
    </div>
  );
}

export default FilePicker;
