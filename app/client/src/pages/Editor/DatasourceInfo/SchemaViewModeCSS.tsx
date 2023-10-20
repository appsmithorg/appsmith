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
  padding: var(--ads-v2-spaces-4) var(--ads-v2-spaces-5);
  padding-left: var(--ads-v2-spaces-7);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border-right: 1px solid var(--ads-v2-color-gray-300);
  flex-shrink: 0;
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
  &.t--gsheet-structure {
    overflow-y: auto;
    .t--spreadsheet-structure > .t--entity-item {
      font-weight: var(--ads-v2-font-weight-bold);
    }
    .t--sheet-structure > .t--entity-item {
      color: var(--ads-v2-color-gray-600);
    }
    .t--sheet-structure.t--sheet-structure-active > .t--entity-item {
      background: var(--ads-v2-color-gray-100);
    }
  }
  div {
    flex-shrink: 0;
  }
  div ~ div {
    flex: 1;
  }
  .t--schema-virtuoso-container {
    height: 100%;
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
    margin-top: var(--ads-v2-spaces-3);
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
  && > div > div {
    border: none;
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
`;
