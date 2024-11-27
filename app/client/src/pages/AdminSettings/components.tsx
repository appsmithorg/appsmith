import styled from "styled-components";
import { Classes } from "@blueprintjs/core";
import { Link, Text, IDE_HEADER_HEIGHT } from "@appsmith/ads";

export const Wrapper = styled.div`
  flex-basis: calc(100% - ${(props) => props.theme.homePage.leftPane.width}px);
  padding: var(--ads-v2-spaces-7);

  /* 84px is the height of save bottom bar */
  height: calc(100vh - ${(props) => props.theme.homePage.header}px - 84px);
  overflow: auto;
`;

export const HeaderWrapper = styled.div<{ margin?: string }>`
  margin-bottom: ${(props) => props.margin ?? `16px`};
`;

export const SettingsHeader = styled(Text)`
  margin-bottom: 0px;
`;

export const SettingsSubHeader = styled(Text)``;

export const SettingsFormWrapper = styled.div`
  max-width: 40rem;
  .openid_tag {
    .${Classes.TAG_REMOVE} {
      display: none;
    }
  }
`;

export const BottomSpace = styled.div`
  height: ${(props) => props.theme.settings.footerHeight + 20}px;
`;

export const ContentWrapper = styled.div``;

export const LoaderContainer = styled.div`
  height: calc(100vh - ${IDE_HEADER_HEIGHT}px);
  display: flex;
  justify-content: center;
  width: 100%;
  align-items: center;
`;

export const ContentBox = styled.div`
  border-radius: var(--ads-v2-border-radius);
  border-color: var(--ads-v2-color-border);

  .business-tag {
    width: fit-content;
  }

  .hover-state {
    border-radius: var(--ads-v2-border-radius);
    background-color: var(--ads-v2-color-bg-subtle);
  }
`;

export const HelperText = styled(Text)`
  font-size: 12px;
  color: var(--ads-v2-color-fg-muted);
`;

export const NoUnderLineLink = styled(Link)`
  text-decoration: none !important;
`;
