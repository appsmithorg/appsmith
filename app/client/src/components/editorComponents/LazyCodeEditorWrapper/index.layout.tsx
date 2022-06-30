import styled from "styled-components";

import { Icon } from "components/ads";

export const ReadOnlyInput = styled.input`
  width: 100%;
  background-color: rgba(0, 0, 0, 0) !important;
  font-family: monospace !important;
  font-weight: 400 !important;
  line-height: 21px !important;

  position: absolute;
  top: 0;
  left: 0;
  z-index: 2;
  min-height: inherit;
  height: -webkit-fill-available !important;
`;

export const HighlighedCodeContainer = styled("div")<{
  containsCode: boolean;
}>`
  width: 100%;
  background-color: #fff !important;
  font-family: monospace !important;
  font-weight: 400 !important;
  line-height: 21px !important;

  min-height: inherit;
  padding: 6px 10px !important;

  pre {
    margin: 0 !important;
    overflow: hidden !important;
    font-family: monospace !important;
    padding: 0 !important;
    background: white !important;

    word-wrap: break-word !important;
    white-space: pre-wrap !important;
    word-break: normal !important;

    code {
      background: white !important;
      font-family: monospace !important;
      line-height: 1.495 !important;
    }
  }
`;

export const LintErrorContainer = styled.div`
  background-color: white;
  padding: 8px;

  position: absolute;
  bottom: 30px;
  left: 50px;
  box-shadow: 0px 4px 8px 1px rgba(0, 0, 0, 0.3);

  display: flex;
`;

export const IconWrapper = styled(Icon)`
  margin-right: 4px;
`;

export const LazyEditorWrapper = styled("div")`
  position: relative;
`;

export const ContentWrapper = styled("div")<{ containsCode: boolean }>`
  overflow: hidden;
  height: ${({ containsCode }) => (containsCode ? "auto" : "38px")};
  min-height: 36px;
  border: 1px solid;
  border-color: inherit;

  div:nth-child(1) {
    min-height: 36px;
  }
`;

export const NoCodeText = styled("div")`
  color: #858282 !important;
`;
