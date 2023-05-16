import styled, { keyframes } from "styled-components";
import { ContentKind } from "./types";

export const HighlighedCodeContainer = styled("div")<{
  contentKind: ContentKind;
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

    color: ${({ contentKind }) =>
      contentKind === ContentKind.CODE
        ? "#063289"
        : contentKind === ContentKind.PLACEHOLDER
        ? "#858282"
        : "inherit"} !important;
  }
`;

export const LazyEditorWrapper = styled("div")`
  display: contents;
`;

export const ContentWrapper = styled("div")<{
  contentKind: ContentKind;
}>`
  overflow: hidden;
  width: 100%;
  height: ${({ contentKind }) =>
    contentKind === ContentKind.PLACEHOLDER ? "36px" : "auto"};
  min-height: 34px;
  border: 1px solid;
  border-color: inherit;
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
  background-color: var(--ads-color-brand);

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
