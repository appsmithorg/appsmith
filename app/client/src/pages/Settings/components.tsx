import styled from "styled-components";
import { Classes } from "@blueprintjs/core";

export const Wrapper = styled.div`
  flex-basis: calc(100% - ${(props) => props.theme.homePage.leftPane.width}px);
  padding-top: 40px;
`;

export const HeaderWrapper = styled.div<{ margin?: string }>`
  margin-bottom: ${(props) => props.margin ?? `16px`};
`;

export const SettingsHeader = styled.h2`
  font-size: 24px;
  font-weight: 500;
  text-transform: capitalize;
  margin-bottom: 0px;
`;

export const SettingsSubHeader = styled.div`
  font-size: 12px;
`;

export const SettingsFormWrapper = styled.div`
  /* 84px is the height of save bottom bar */
  height: calc(100vh - ${(props) => props.theme.homePage.header}px - 84px);
  overflow: auto;

  .openid_tag {
    .${Classes.TAG_REMOVE} {
      display: none;
    }
  }
`;

export const MaxWidthWrapper = styled.div`
  max-width: 40rem;
`;

export const BottomSpace = styled.div`
  height: ${(props) => props.theme.settings.footerHeight + 20}px;
`;

export const ContentWrapper = styled.div``;

export const LoaderContainer = styled.div`
  height: ${(props) => `calc(100vh - ${props.theme.smallHeaderHeight})`};
  display: flex;
  justify-content: center;
  width: 100%;
`;
