import styled from "styled-components";

export const ViewModeSchemaContainer = styled.div`
  height: 100%;
  width: 100%;
  display: flex;
  flex-direction: column;
`;

export const DataWrapperContainer = styled.div`
  display: flex;
  flex: 1;
  overflow: hidden;
  .t--datasource-column:hover {
    background: none;
    cursor: default;
  }
`;

export const StructureContainer = styled.div`
  height: 100%;
  width: 25%;
  padding: var(--ads-v2-spaces-4) 0 var(--ads-v2-spaces-4)
    var(--ads-v2-spaces-5);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border-right: 1px solid var(--ads-v2-color-gray-300);
  flex-shrink: 0;
  & > .datasourceStructure-header {
    padding: 0 var(--ads-v2-spaces-5);
  }
`;

export const DatasourceDataContainer = styled.div`
  height: 100%;
  width: 75%;
  display: flex;
  flex-direction: column;
`;

export const DatasourceListContainer = styled.div`
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 0 var(--ads-v2-spaces-5);
  &.t--gsheet-structure {
    padding-bottom: var(--ads-v2-spaces-8);
    .t--gsheet-structure-list {
      overflow-y: auto;
      flex-shrink: 1;
      flex-grow: 0;
      scrollbar-gutter: stable;
    }
    .t--spreadsheet-structure > .t--entity-item {
      font-weight: var(--ads-v2-font-weight-bold);
      height: 36px;
      padding-left: 0;
      & .ads-v2-button__content:hover {
        background: none;
      }
    }
    .t--spreadsheet-structure {
      padding-right: var(--ads-spaces-3);
      flex-grow: 0;
      flex-shrink: 0;
    }
    .t--sheet-structure:not(:last-of-type) {
      padding-bottom: var(--ads-spaces-3);
    }
    .t--sheet-structure .t--datasource-column {
      padding-top: var(--ads-spaces-1);
      padding-bottom: var(--ads-spaces-1);
    }
    .t--sheet-structure > .t--entity-item {
      color: var(--ads-v2-color-gray-600);
      height: 36px;
      padding-left: var(--ads-spaces-10);
    }
    .t--sheet-structure .t--datasource-column {
      color: var(--ads-v2-color-gray-600);
      height: 30px;
      padding-left: var(--ads-spaces-10);
    }
    .t--sheet-structure.t--sheet-structure-active > .t--entity-item {
      background: var(--ads-v2-color-gray-100);
    }
    .t--sheet-structure .t--entity-name {
      padding: var(--ads-spaces-2) 0;
    }
  }
  .t--schema-virtuoso-container {
    height: 100%;
  }
`;

export const DatasourceAttributesWrapper = styled.div`
  padding: var(--ads-spaces-1) 0 var(--ads-spaces-1) var(--ads-spaces-10);
  .t--datasource-column > div > div:first-of-type {
    padding-right: var(--ads-spaces-3);
  }
  .t--datasource-column > div > div:last-of-type {
    flex-shrink: 0;
    flex-grow: 0;
  }
`;

export const ButtonContainer = styled.div`
  display: flex;
  flex-shrink: 0;
  justify-content: flex-end;
  border-top: 1px solid var(--ads-v2-color-gray-300);
  padding: var(--ads-v2-spaces-4);
`;

export const MessageWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: auto;
  &.t--item-loading-indicator {
    justify-content: flex-start;
    padding: var(--ads-spaces-1) 0 var(--ads-spaces-1) var(--ads-spaces-11);
  }
  &.t--item-loading-indicator--spreadsheet,
  &.t--item-loading-indicator--schema {
    padding-left: 0;
  }
`;

export const SchemaStateMessageWrapper = styled.div`
  width: auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  text-align: center;
  padding: 0 var(--ads-spaces-3);
  img {
    padding-bottom: var(--ads-v2-spaces-7);
  }
  span:first-child {
    padding-bottom: var(--ads-v2-spaces-2);
  }
`;

export const TableWrapper = styled.div`
  overflow-x: auto;
  height: 100%;
  && > div {
    width: 100%;
  }

  && > ${MessageWrapper} {
    width: 100%;
    height: 100%;
  }
  && .t--table-response {
    border: none;
    height: 100%;
    overflow: hidden;
  }
  && .tableWrap {
    overflow: auto;
  }
  & .table {
    background: none;
    & > div:first-child {
      position: sticky;
      top: 0;
      z-index: 1;
    }
    & .draggable-header {
      cursor: default;
    }
  }
  & .table div:first-of-type .tr {
    background: var(--ads-v2-color-black-5);
    border-right: none;
    border-bottom: 1px solid var(--ads-v2-color-black-75);
  }
  && .table div.tbody .tr {
    background: var(--ads-v2-color-white);
    border-bottom: 1px solid var(--ads-v2-color-black-75);
  }
  && .table .td,
  && .table .th {
    border-right: none;
    border-bottom: none;
  }
  button {
    margin-right: 24px;
  }
  && .tableWrap {
  }
`;

export const DatasourceStructureSearchContainer = styled.div`
  margin: var(--ads-v2-spaces-3) 0 var(--ads-v2-spaces-2) 0;
  background: white;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: var(--ads-v2-spaces-2);
  &.t--gsheet-search-container {
    margin-top: var(--ads-v2-spaces-4);
    margin-bottom: var(--ads-v2-spaces-2);
  }
  &.t--search-container--query-editor {
    margin: 0;
  }
`;
