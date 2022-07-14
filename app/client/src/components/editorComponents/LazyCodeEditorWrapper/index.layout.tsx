import styled from "styled-components";

export const ReadOnlyInput = styled.input`
  width: 100%;
  background-color: rgba(0, 0, 0, 0) !important;

  position: absolute;
  top: 0;
  left: 0;
  z-index: 2;
  min-height: inherit;
  height: -webkit-fill-available !important;
`;

export const HighlighedCodeContainer = styled("div")<{
  containsCode: boolean;
  containsObject?: boolean;
}>`
  width: 100%;
  background-color: #fff !important;
  font-family: monospace !important;
  font-weight: 400 !important;
  line-height: 21px !important;

  min-height: inherit;
  padding-top: 6px !important;
  padding-left: 10px !important;
  padding-right: 10px !important;
  padding-bottom: 6px !important;

  pre {
    margin: 0 !important;
    overflow: hidden !important;
    font-size: 14px !important;
    font-family: monospace !important;
    padding: 0 !important;
    background: white !important;

    word-wrap: break-word !important;
    white-space: pre-wrap !important;
    word-break: normal !important;

    code {
      background: white !important;
      font-family: monospace !important;
      line-height: 21px !important;
      font-size: 14px !important;
      color: ${({ containsCode, containsObject }) =>
        containsCode && !containsObject ? "#063289" : "inherit"} !important;

      .token {
        color: ${({ containsCode, containsObject }) =>
          containsCode && !containsObject ? "#063289" : "inherit"} !important;
      }
    }
  }
`;

export const LazyEditorWrapper = styled("div")`
  position: relative;
`;

export const ContentWrapper = styled("div")<{
  containsCode: boolean;
  isPlaceholder?: boolean;
}>`
  overflow: hidden;
  height: ${({ containsCode, isPlaceholder }) =>
    containsCode || !isPlaceholder ? "auto" : "36px"};
  min-height: 34px;
  border: 1px solid;
  border-color: inherit;
`;

export const NoCodeText = styled("div")<{ isPlaceholder?: boolean }>`
  color: ${({ isPlaceholder }) =>
    isPlaceholder ? "#858282" : "inherit"} !important;
`;
