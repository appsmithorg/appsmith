import React, { useState } from "react";
import ReactDOM from "react-dom";
import styled from "styled-components";

import Container from "./Container";

const StyledDocsSearchModal = styled.div`
  position: absolute;
  top: 100px;
  left: 100px;
  z-index: 12;
`;

const DocsSearchModal = () => (
  <StyledDocsSearchModal>
    <Container />
  </StyledDocsSearchModal>
);

const DocsSearch = () => {
  const [show, setShow] = useState(true);
  return (
    <>
      <div onClick={() => setShow(!show)}>show help modal</div>
      {show && ReactDOM.createPortal(<DocsSearchModal />, document.body)}
    </>
  );
};

export default DocsSearch;
