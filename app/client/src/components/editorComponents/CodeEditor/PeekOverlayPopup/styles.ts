import styled, { css } from "styled-components";
import { Divider } from "@appsmith/ads";

export const PeekOverlayContainer = styled.div<{
  $left: string;
  $top?: string;
  $bottom?: string;
}>`
  min-height: 46px;
  max-height: 252px;
  width: 300px;
  background-color: var(--ads-v2-color-bg);
  box-shadow: 0 0 10px #0000001a; // color used from designs
  border-radius: var(--ads-v2-border-radius);
  left: ${({ $left }) => $left};
  top: ${({ $top }) => $top};
  bottom: ${({ $bottom }) => $bottom};
`;

export const DataType = styled.div`
  height: 24px;
  color: var(--appsmith-color-black-700);
  padding: var(--ads-v2-spaces-2) 0 var(--ads-v2-spaces-2)
    var(--ads-v2-spaces-4);
  font-size: 10px;
`;

export const BlockDivider = styled(Divider)`
  display: block;
`;

export const PeekOverlayData = styled.div`
  min-height: 20px;
  padding: var(--ads-v2-spaces-1) 0 var(--ads-v2-spaces-1)
    var(--ads-v2-spaces-4);
  font-size: 10px;
`;

export const ReactJSONViewerOverrider = css<{ $fontSize: string }>`
  // all ellipsis font size

  .node-ellipsis,
  .function-collapsed span:nth-child(2),
  .string-value span {
    font-size: ${({ $fontSize }) => $fontSize} !important;
  }

  .pretty-json-container {
    font-family: ${(props) => props.theme.fonts.code};
  }

  // collapse icon color change and alignment

  .icon-container {
    width: 10px !important;
    height: 8px !important;

    svg {
      color: var(--appsmith-color-black-600) !important;
    }
  }

  // font-sizes and alignments

  .pushed-content.object-container {
    .object-content {
      padding-left: 4px !important;

      .variable-row {
        padding-top: 0 !important;
        padding-bottom: 0 !important;
        border-left: 0 !important;

        .variable-value div {
          font-size: ${({ $fontSize }) => $fontSize} !important;
          padding-top: 0 !important;
          padding-bottom: 0 !important;
        }
      }

      .object-key-val {
        padding-top: 0 !important;
        padding-bottom: 0 !important;
        padding-left: 0 !important;
        border-left: 0 !important;
      }
    }
  }

  // disabling function collapse and neutral styling

  .rjv-function-container {
    pointer-events: none;
    font-weight: normal !important;

    .function-collapsed {
      font-weight: normal !important;

      span:nth-child(1) {
        display: none; // hiding extra braces
      }

      span:nth-child(2) {
        color: #393939 !important;
      }
    }
  }

  div:has(.rjv-function-container) {
    cursor: default !important;
  }
`;

export const JsonWrapper = styled.div<{ $fontSize: string }>`
  min-height: 20px;
  max-height: 225px;
  overflow-y: auto;
  ${ReactJSONViewerOverrider}
`;
