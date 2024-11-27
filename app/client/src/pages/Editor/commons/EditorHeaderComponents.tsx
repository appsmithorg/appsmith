import styled from "styled-components";
import { Profile } from "pages/common/ProfileImage";
import { getTypographyByKey } from "@appsmith/ads-old";
import { IDE_HEADER_HEIGHT } from "IDE";

export const HeaderWrapper = styled.div`
  width: 100%;
  display: flex;
  align-items: center;
  background-color: var(--ads-v2-color-bg);
  flex-direction: row;
  box-shadow: none;
  border-bottom: 1px solid var(--ads-v2-color-border);
  height: ${IDE_HEADER_HEIGHT}px;
  & .editable-application-name {
    ${getTypographyByKey("h4")}
    color: ${(props) => props.theme.colors.header.appName};
  }
  & ${Profile} {
    width: 24px;
    height: 24px;
  }

  @media only screen and (max-width: 900px) {
    & .help-bar {
      display: none;
    }
  }

  @media only screen and (max-width: 700px) {
    & .app-realtime-editors {
      display: none;
    }
  }
`;

export const HeaderSection = styled.div`
  position: relative;
  display: flex;
  flex: 1;
  overflow: visible;
  align-items: center;
  :nth-child(1) {
    justify-content: flex-start;
    max-width: 30%;
  }
  :nth-child(2) {
    justify-content: center;
  }
  :nth-child(3) {
    justify-content: flex-end;
  }
`;
