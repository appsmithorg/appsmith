import styled, { css } from "styled-components";

const ReactJSONViewerOverrider = css<{ $fontSize: string; $iconSize: string }>`
  font-size: ${({ $fontSize }) => $fontSize} !important;

  // all ellipsis font size

  .node-ellipsis,
  .function-collapsed span:nth-child(2),
  .string-value span {
    font-size: ${({ $fontSize }) => $fontSize} !important;
  }

  // disable and hide first object collapse icon

  .pretty-json-container
    > .object-content:first-of-type
    > .object-key-val:first-of-type
    > span {
    pointer-events: none !important;

    .icon-container {
      display: none !important;
    }
  }

  .pretty-json-container {
    font-family: ${(props) => props.theme.fonts.code};
  }

  // collapse icon color change and alignment

  .icon-container {
    width: ${({ $iconSize }) => $iconSize} !important;
    height: ${({ $iconSize }) => $iconSize} !important;

    .expanded-icon {
      svg {
        vertical-align: middle !important;
        padding-left: 0px !important;
        width: 0.8em !important;
      }
    }

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

    > span:first-child:before {
      // In prod build, for some reason react-json-viewer
      // misses adding this opening braces for function
      content: "(";
    }

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

export const Container = styled.div<{ $fontSize: string; $iconSize: string }>`
  ${ReactJSONViewerOverrider}
`;
