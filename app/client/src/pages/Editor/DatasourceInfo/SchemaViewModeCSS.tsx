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
  padding-left: var(--ads-v2-spaces-5);
  &.t--gsheet-structure {
    overflow-y: auto;
    .t--spreadsheet-structure > .t--entity-item {
      font-weight: var(--ads-v2-font-weight-bold);
      height: 25px;
      padding-left: 0;
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
    .t--sheet-structure > .t--entity-item,
    .t--sheet-structure .t--datasource-column {
      color: var(--ads-v2-color-gray-600);
      height: 25px;
      padding-left: var(--ads-spaces-10);
    }
    .t--sheet-structure.t--sheet-structure-active > .t--entity-item {
      background: var(--ads-v2-color-gray-100);
    }
    .t--sheet-structure .t--entity-name {
      padding: var(--ads-spaces-2) 0;
    }
  }
  div {
    flex-shrink: 0;
  }
  div ~ div {
    flex-grow: 1;
  }
  .t--schema-virtuoso-container {
    height: 100%;
  }
`;

export const DatasourceAttributesWrapper = styled.div`
  padding: var(--ads-spaces-1) 0 var(--ads-spaces-1) var(--ads-spaces-10);
  .t--datasource-column:hover {
    background: none;
  }
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
  height: 100%;
  &.t--gsheet-loading-indicator {
    justify-content: flex-start;
    padding: var(--ads-spaces-1) 0 var(--ads-spaces-1) var(--ads-spaces-11);
  }
`;

export const SchemaStateMessageWrapper = styled.div`
  width: auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
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
  margin-bottom: 8px;
  position: sticky;
  top: 0;
  overflow: hidden;
  z-index: 10;
  background: white;
  &.t--gsheet-search-container {
    flex-shrink: 0;
    padding: 0 var(--ads-v2-spaces-5);
    margin-top: 8px;
  }
`;
