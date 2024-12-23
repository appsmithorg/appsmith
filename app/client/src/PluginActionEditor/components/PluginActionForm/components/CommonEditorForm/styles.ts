import styled from "styled-components";
import { Tabs as AdsTabs, TabPanel as AdsTabPanel } from "@appsmith/ads";

export const RequestMethodSelectContainer = styled.div`
  width: 100px;
  .ads-v2-select > .rc-select-selector {
    min-width: 100px;
  }
`;

export const DatasourcePathFieldContainer = styled.div`
  width: 100%;
`;

export const FormHeader = styled.div`
  position: sticky;
  grid-area: header;
  top: calc(-1 * var(--ads-v2-spaces-4));
  padding-top: var(--ads-v2-spaces-4);
  margin-top: calc(-1 * var(--ads-v2-spaces-4));
  align-self: start;
  z-index: 100;
  background-color: var(--ads-color-background);
`;

export const Tabs = styled(AdsTabs)`
  display: grid;
  grid-template-columns: 1fr;
  grid-template-rows: auto 1fr;
  grid-template-areas: "header" "body";
  width: 100%;
`;

export const TabPanel = styled(AdsTabPanel)`
  height: calc(100% - 50px);
`;
