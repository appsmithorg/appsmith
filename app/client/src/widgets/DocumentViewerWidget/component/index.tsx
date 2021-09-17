import React from "react";
import styled from "styled-components";
import { DocumentViewer } from "react-documents";

const EmptyWrapper = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
`;

function DocumentViewerComponent(props: DocumentViewerComponentProps) {
  if (!!props.docUrl) {
    return <DocumentViewer url={props.docUrl} viewer="url" />;
  } else {
    return <EmptyWrapper>No document url provided for viewer</EmptyWrapper>;
  }
}

export interface DocumentViewerComponentProps {
  docUrl: string;
}

export default DocumentViewerComponent;
