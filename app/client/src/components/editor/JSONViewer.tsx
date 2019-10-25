import React from "react";
import ReactJson from "react-json-view";
import styled from "styled-components";

const JSONViewWrapper = styled.div`
  max-height: 600px;
  overflow-y: auto;
  & > div {
    font-size: ${props => props.theme.fontSizes[2]}px;
  }
`;

const JSONViewer = (props: { data: JSON }) => {
  if (!props.data) return <div />;
  return (
    <JSONViewWrapper>
      <ReactJson
        src={props.data}
        displayObjectSize={false}
        displayDataTypes={false}
        indentWidth={2}
        enableClipboard={false}
      />
    </JSONViewWrapper>
  );
};

export default JSONViewer;
