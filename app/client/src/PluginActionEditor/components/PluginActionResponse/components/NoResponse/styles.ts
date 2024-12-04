import styled from "styled-components";
import { Text as AdsText } from "@appsmith/ads";

import { TAB_BAR_HEIGHT } from "../constants";

export const Text = styled(AdsText)`
  &&&& {
    margin-top: 0;
  }
`;

export const Container = styled.div`
  width: 100%;
  height: calc(100% - ${TAB_BAR_HEIGHT}px);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: 24px;
`;

export const RunGroup = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
`;
