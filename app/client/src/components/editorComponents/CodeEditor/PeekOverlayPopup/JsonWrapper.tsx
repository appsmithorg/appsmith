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
  .node-ellipsis,
  .function-collapsed span:nth-child(2),
  .string-value span {
    font-size: 10px !important;
  }
  .icon-container {
    width: 10px !important;
    height: 8px !important;
    svg {
      color: var(--appsmith-color-black-600) !important;
    }
  }
  .pushed-content.object-container {
    .object-content {
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
        padding-left: 4px !important;
        border-left: 0 !important;
      }
    }
  }

  .rjv-function-container {
    pointer-events: none;
    font-weight: normal !important;
    .function-collapsed {
      font-weight: normal !important;
      span:nth-child(1) {
        display: none;
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
