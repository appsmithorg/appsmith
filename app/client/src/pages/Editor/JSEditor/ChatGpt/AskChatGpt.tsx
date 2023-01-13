import React, { useCallback, useEffect } from "react";
import { useState } from "react";
import styled from "styled-components";
import { queryChatGpt } from "./queryChatGpt";

const ModalComponent = styled.div`
  z-index: 100;
  background: white;
  border: 1px solid black;
  height: 15rem;
  width: 50%;
  position: relative;
  top: 1rem;
  padding: 1rem;
  box-shadow: 10px 5px 5px grey;
`;
const InputComponent = styled.input`
  margin-bottom: 1rem;
  border: 1px solid black;
  width: 100%;
`;
const ResultsComponent = styled.p`
  overflow-y: auto;
  height: 100%;
`;
const Modal = () => {
  const [search, setSearch] = useState("");
  const [result, setResult] = useState();
  const [isLoading, setIsLoading] = useState(false);
  const query = useCallback(async function query(searchText) {
    if (!searchText) return;
    setIsLoading(true);
    const result = await queryChatGpt(searchText);
    setIsLoading(false);
    setResult(result);
  }, []);
  useEffect(() => {
    const timeoutId = setTimeout(() => query(search), 100);
    return () => {
      clearTimeout(timeoutId);
    };
  }, [search]);

  return (
    <ModalComponent>
      <label>Enter a query</label>
      <InputComponent
        onChange={(e) => setSearch(e.target.value)}
        value={search}
      />

      <p>Relevant results</p>
      <ResultsComponent>{isLoading ? "Loading..." : result}</ResultsComponent>
    </ModalComponent>
  );
};
function AskChatGpt() {
  const [open, setOpen] = useState(false);
  if (open) return <Modal />;
  return (
    <button
      onClick={() => {
        setOpen(true);
      }}
    >
      Ask ChatGpt
    </button>
  );
}
export default AskChatGpt;
