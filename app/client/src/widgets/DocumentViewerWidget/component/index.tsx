import React, { Suspense, lazy } from "react";
import styled from "styled-components";
import { DocumentViewer } from "react-documents";
import { includes, replace, split, get } from "lodash";
import {
  SUPPORTED_EXTENSIONS,
  Renderers,
  Renderer,
  ViewerType,
} from "../constants";
import { retryPromise } from "utils/AppsmithUtils";
import Skeleton from "components/utils/Skeleton";

const DocViewer = lazy(() => retryPromise(() => import("./DocViewer")));
const XlsxViewer = lazy(() => retryPromise(() => import("./XlsxViewer")));

const ErrorWrapper = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  background: #fff;
`;

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

const getBlob = (docUrl: string) => {
  // Split into two parts
  const parts = docUrl.split(";base64,");
  // Hold the content type
  const mimeType = parts[0].split(":")[1];

  try {
    // Decode Base64 string
    const decodedData = window.atob(parts[1]);
    // Create UNIT8ARRAY of size same as row data length
    const uInt8Array = new Uint8Array(decodedData.length);
    // Insert all character code into uInt8Array
    for (let i = 0; i < decodedData.length; ++i) {
      uInt8Array[i] = decodedData.charCodeAt(i);
    }
    // Return BLOB image after conversion
    const blob = new Blob([uInt8Array], { type: mimeType });
    return blob;
  } catch (error) {
    return;
  }
};

// get extension from base64
const getFileExtensionFromBase64 = (docUrl: string) => {
  let extension = "";
  const fileType = docUrl.split(";")[0].split("/")[1];

  switch (fileType) {
    case "vnd.openxmlformats-officedocument.wordprocessingml.document":
      extension = "docx";
      break;
    case "vnd.openxmlformats-officedocument.spreadsheetml.sheet":
      extension = "xlsx";
      break;
    case "plain":
      extension = "txt";
      break;
    case "pdf":
      extension = "pdf";
      break;
    default:
      break;
  }

  return extension;
};

interface ConfigResponse {
  url: string;
  blob?: Blob;
  viewer: ViewerType;
  renderer: Renderer;
  errorMessage?: string;
}

export const getDocViewerConfigs = (docUrl: string): ConfigResponse => {
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
  let viewer = "url" as ViewerType;
  let url = docUrl;
  let blob;
  let errorMessage = !!docUrl ? "" : "No document url provided for viewer";
  let renderer: Renderer = errorMessage
    ? Renderers.ERROR
    : Renderers.DOCUMENT_VIEWER;

  if (docUrl && includes(docUrl, "base64")) {
    const extension = getFileExtensionFromBase64(docUrl);
    const isValidExtension = SUPPORTED_EXTENSIONS.includes(extension);
    if (isValidExtension) {
      blob = getBlob(docUrl);
      if (blob) {
        if (extension === "docx") {
          renderer = Renderers.DOCX_VIEWER;
        } else if (extension === "xlsx") {
          renderer = Renderers.XLSX_VIEWER;
        }
      } else {
        errorMessage = "invalid base64 data";
        renderer = Renderers.ERROR;
      }
    } else {
      errorMessage = "Current file type is not supported " + extension;
      renderer = Renderers.ERROR;
    }
    return { blob, url, viewer, errorMessage, renderer };
  }

  // handled dropbox url
  if (includes(url, "dropbox.com")) {
    if (includes(url, "?dl=0") || !includes(url, "?raw=1")) {
      url = replace(url, "?dl=0", "");
      url = url + "?raw=1";
    }
    return { url, viewer, renderer };
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
    return { url, viewer, renderer };
  }

  // check url extension and if it is supported
  const { extension, hasExtension, validExtension } = checkUrlExtension(url);
  if (hasExtension) {
    if (validExtension) {
      if (!(extension === "txt" || extension === "pdf")) {
        viewer = "office";
        renderer = Renderers.DOCUMENT_VIEWER;
      }
    } else {
      errorMessage = "Current file type is not supported";
      renderer = Renderers.ERROR;
    }
  }

  return { url, viewer, errorMessage, renderer };
};

function DocumentViewerComponent(props: DocumentViewerComponentProps) {
  const { blob, errorMessage, renderer, url, viewer } = React.useMemo(
    () => getDocViewerConfigs(props.docUrl),
    [props.docUrl],
  );
  switch (renderer) {
    case Renderers.ERROR:
      return <ErrorWrapper>{errorMessage}</ErrorWrapper>;
    case Renderers.DOCX_VIEWER:
      return (
        <Suspense fallback={<Skeleton />}>
          <DocViewer blob={blob} />
        </Suspense>
      );
    case Renderers.XLSX_VIEWER:
      return (
        <Suspense fallback={<Skeleton />}>
          <XlsxViewer blob={blob} />
        </Suspense>
      );
    case Renderers.DOCUMENT_VIEWER:
      return <DocumentViewer url={url} viewer={viewer} />;

    default:
      return null;
  }
}

export interface DocumentViewerComponentProps {
  docUrl: string;
}

export default DocumentViewerComponent;
