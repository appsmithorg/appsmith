import styled, { keyframes } from "styled-components";
import { ContentKind } from "./types";
import { CodeEditorColors } from "../CodeEditor/constants";

export const HighlighedCodeContainer = styled("div")<{
  contentKind: ContentKind;
  showLineNumbers?: boolean;
  isReadOnly?: boolean;
}>`
  width: 100%;
  background-color: #fff !important;
  font-weight: 400 !important;
  line-height: 21px !important;
  padding: 6px;

  pre {
    font-family: ${(props) => props.theme.fonts.code};
    margin: 0 !important;
    overflow: hidden !important;
    font-size: ${(props) => (props.isReadOnly ? "12px" : "13px")} !important;
    padding: 0 !important;
    tab-size: 2 !important;
    background: white !important;
    ${(props) => {
      if (props.isReadOnly) {
        return "padding-left: 35px !important";
      }

      if (props.showLineNumbers) {
        return "padding-left: 47px !important";
      }
    }};

    word-wrap: break-word !important;
    white-space: pre-wrap !important;
    word-break: normal !important;

    color: ${({ contentKind }) =>
      contentKind === ContentKind.CODE
        ? CodeEditorColors.KEYWORD
        : contentKind === ContentKind.PLACEHOLDER
          ? "#858282"
          : "inherit"} !important;
  }
`;

export const LazyEditorWrapper = styled("div")`
  display: contents;
`;

export const ContentWrapper = styled("div")<{
  borderLess: boolean;
  contentKind: ContentKind;
  showLineNumbers?: boolean;
  folding?: boolean;
  height?: string | number;
}>`
  overflow: hidden;
  width: 100%;
  height: ${({ contentKind, height }) =>
    !!height
      ? height
      : contentKind === ContentKind.PLACEHOLDER
        ? "36px"
        : "auto"};
  min-height: 36px;
  border: ${(props) => (props.borderLess ? "none" : "1px solid")};
  border-color: inherit;
  ${(props) => props.showLineNumbers && "border: none"}
  border-radius: var(--ads-v2-border-radius);
`;

const opacityAnimation = keyframes`
  0% { opacity: 0; }
  100% { opacity: 1; }
`;

export const ProgressContainer = styled.div`
  opacity: 0;
  animation: ${opacityAnimation} 0.25s ease-out;
  // Delay the animation start by 0.5s to avoid showing the progress bar when the editor loads quickly enough
  animation-delay: 0.5s;
  // Keep opacity: 1 even when the animation ends
  animation-fill-mode: forwards;
`;

const progressBarAnimation = keyframes`
  0% {
    transform: scaleX(0.01);
  }

  100% {
    transform: scaleX(0.98);
  }
`;

export const ProgressBar = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 2px;
  background-color: var(--ads-v2-color-bg-brand);

  transform-origin: left;
  animation: ${progressBarAnimation} 60s;
  // Fill the progress bar faster at the beginning – but then gradually slow it down. Inspired by the progress bar
  // in Windows Explorer. This provides a realistic UX in cases where the editor loads quickly, as the progress bar
  // fills quickly at first; but also doesn’t fill it to 100% too quickly if the editor takes longer to load.
  animation-timing-function: cubic-bezier(0.02, 0.96, 1, 1);
  // Keep the last frame of the animation even after the animation ends
  // (in case the editor takes longer than 60s to load)
  animation-fill-mode: forwards;
`;

export const SpinnerContainer = styled.div`
  position: absolute;
  top: 10px;
  right: 8px;
`;
