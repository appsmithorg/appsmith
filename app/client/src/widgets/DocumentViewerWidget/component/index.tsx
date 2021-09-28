import React from "react";
import styled from "styled-components";
import { DocumentViewer } from "react-documents";
import { includes, replace, split, get } from "lodash";
import { SUPPORTED_EXTENSIONS } from "../constants";

const ErrorWrapper = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
`;

type viewerType = "google" | "office" | "mammoth" | "pdf" | "url";

const checkUrlExtension = (docUrl: string) => {
  // Remove everything to the last slash in URL
  let url = docUrl.substr(1 + docUrl.lastIndexOf("/"));
  // Break URL at ? and take first part (file name, extension)
  url = url.split("?")[0];
  // Sometimes URL doesn't have ? but #, so we should aslo do the same for #
  url = url.split("#")[0];
  // Now we have only filename and extension
  const chunkList = url.split(".");
  if (chunkList.length > 1) {
    const ext = chunkList[chunkList.length - 1];
    // check extension is valid or not
    const validExtension = SUPPORTED_EXTENSIONS.includes(ext);
    return {
      hasExtension: true,
      validExtension: validExtension,
      extension: ext,
    };
  } else {
    // might be preview url
    return { hasExtension: false };
  }
};

export const getDocViewerConfigs = (docUrl: string) => {
  /**
   * From user provided document url decide on which viewer to use
   * handle different cases for url hosts
   * Case 1: Dropbox
   *  if user exported download url than change that to raw url
   * Case 2: Onedrive
   *  change url to embeded url to show in viewer
   * Case 3:
   *  All other urls will be either Google Preview or urls with file extentions ( e.x. from aws s3 )
   *  need to verify urls with extention and use default viewer "url viewer" for them
   */
  let viewer = "url" as viewerType;
  let url = docUrl;
  let errorMessage = !!docUrl ? "" : "No document url provided for viewer";

  // handled dropbox url
  if (includes(url, "dropbox.com")) {
    if (includes(url, "?dl=0") || !includes(url, "?raw=1")) {
      url = replace(url, "?dl=0", "");
      url = url + "?raw=1";
    }
    return { url, viewer };
  }
  // handled onedrive url
  if (includes(url, "onedrive.live.com")) {
    const onedriveUrl = new URL(url);
    const onedriveUrlParamList = split(onedriveUrl.search, /[?&=]+/);
    const cid = get(
      onedriveUrlParamList,
      onedriveUrlParamList.indexOf("cid") + 1,
    );
    const resid = get(
      onedriveUrlParamList,
      onedriveUrlParamList.indexOf("id") + 1,
    );

    url = `https://onedrive.live.com/embed?cid=${cid}&resid=${resid}&em=2`;
    return { url, viewer };
  }

  // check url extension and if it is supported
  const { extension, hasExtension, validExtension } = checkUrlExtension(url);
  if (hasExtension) {
    if (validExtension) {
      if (!(extension === "txt" || extension === "pdf")) {
        viewer = "office";
      }
    } else {
      errorMessage = "Current file type is not supported";
    }
  }

  return { url, viewer, errorMessage };
};

function DocumentViewerComponent(props: DocumentViewerComponentProps) {
  const { errorMessage, url, viewer } = React.useMemo(
    () => getDocViewerConfigs(props.docUrl),
    [props.docUrl],
  );
  if (errorMessage) {
    return <ErrorWrapper>{errorMessage}</ErrorWrapper>;
  }
  return <DocumentViewer url={url} viewer={viewer} />;
}

export interface DocumentViewerComponentProps {
  docUrl: string;
}

export default DocumentViewerComponent;
