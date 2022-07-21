import React, { useEffect, useState } from "react";
import mammoth from "mammoth";
import styled from "styled-components";
import Interweave from "interweave";

const StyledViewer = styled.div`
  width: 100%;
  height: 100%;
  background: #fff;
  overflow: auto;
`;
export default function DocViewer(props: { blob?: Blob }) {
  const [state, setState] = useState({ isLoading: false, isError: false });
  const [htmlContent, setHtmlContent] = useState("");
  // when DocViewer gets new Blob of uploaded file convert it to html for preview
  useEffect(() => {
    setState({ isLoading: true, isError: false });
    setHtmlContent("");
    props.blob
      ?.arrayBuffer()
      .then((buffer) => {
        mammoth
          .convertToHtml(
            { arrayBuffer: buffer },
            { includeEmbeddedStyleMap: true, includeDefaultStyleMap: true },
          )
          .then((result) => {
            setState({ isLoading: false, isError: false });
            setHtmlContent(result.value);
          })
          .catch(() => {
            setHtmlContent("");
            setState({ isLoading: false, isError: true });
          });
      })
      .catch(() => {
        setState({ isLoading: false, isError: false });
        setHtmlContent("");
      });
  }, [props.blob]);
  return (
    <StyledViewer>
      <Interweave content={htmlContent} />
      {state.isLoading ? (
        <div>Loading...</div>
      ) : state.isError ? (
        <div>Failed to read docx content</div>
      ) : (
        <div />
      )}
    </StyledViewer>
  );
}
