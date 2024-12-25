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
  top: calc(-1 * var(--ads-v2-spaces-4));
  padding-top: var(--ads-v2-spaces-4);
  margin-top: calc(-1 * var(--ads-v2-spaces-4));
  z-index: var(--ads-v2-z-index-21);
  background-color: var(--ads-color-background);
  height: 100px;
`;

export const Tabs = styled(AdsTabs)`
  height: max-content;
`;

export const TabPanel = styled(AdsTabPanel)`
  margin: 0 auto;
`;
