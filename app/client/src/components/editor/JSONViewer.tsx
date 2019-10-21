import React from "react";
import ReactJson from "react-json-view";
import styled from "styled-components";

const JSONViewWrapper = styled.div`
  max-height: 600px;
  overflow-y: auto;
`;

const JSONViewer = (props: { data: JSON }) => {
  if (!props.data) return null;
  return (
    <JSONViewWrapper>
      <ReactJson
        src={props.data}
        displayObjectSize={false}
        displayDataTypes={false}
        indentWidth={2}
        enableClipboard={false}
        style={{
          fontSize: "10px",
        }}
      />
    </JSONViewWrapper>
  );
};

export default JSONViewer;
