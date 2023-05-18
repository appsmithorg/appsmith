import styled from "styled-components";

export const reactJsonProps = {
  name: null,
  enableClipboard: false,
  displayDataTypes: false,
  displayArrayKey: true,
  quotesOnKeys: false,
  style: {
    fontSize: "10px",
  },
  collapsed: 1,
  indentWidth: 2,
  collapseStringsAfterLength: 30,
};

export const JsonWrapper = styled.div`
  // all ellipsis font size
  .node-ellipsis,
  .function-collapsed span:nth-child(2),
  .string-value span {
    font-size: 10px !important;
  }

  // disable and hide first object collapser
  .pretty-json-container
    > .object-content:first-of-type
    > .object-key-val:first-of-type
    > span {
    pointer-events: none !important;
    .icon-container {
      display: none !important;
    }
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
          text-transform: lowercase;
          font-size: 10px !important;
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
