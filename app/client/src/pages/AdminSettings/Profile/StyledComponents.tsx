import { Button, Text } from "@appsmith/ads";
import styled from "styled-components";

export const FieldWrapper = styled.div`
  /* width: 460px; */
  /* display: flex; */
  .user-profile-image-picker {
    width: 166px;
    margin-top: 4px;
  }
`;

export const LabelWrapper = styled.div`
  .self-center {
    align-self: center;
  }
  /* width: 240px; */
  /* display: flex; */
  color: var(--ads-v2-color-fg);
  /* font-size: 14px; */
`;

export const Loader = styled.div`
  height: 38px;
  width: 320px;
  border-radius: 0;
`;

export const TextLoader = styled.div`
  height: 15px;
  width: 320px;
  border-radius: 0;
`;

export const ResetPasswordButton = styled(Button)`
  width: fit-content;
`;

export const SubCategory = styled(Text)`
  font-weight: 600;
  color: var(--ads-v2-color-fg-emphasis);
  margin-bottom: 12px;
  margin-top: 24px;
`;

export const SettingsButtonWrapper = styled.div`
  position: fixed;
  bottom: 0;
  right: 0;
  width: ${(props) => `calc(100% - ${props.theme.sidebarWidth})`};
  height: ${(props) => props.theme.settings.footerHeight}px;
  padding: ${(props) => props.theme.spaces[11]}px 20px 24px
    ${(props) =>
      props.theme.homePage.leftPane.leftPadding +
      props.theme.homePage.leftPane.width +
      props.theme.spaces[8]}px;
  /* box-shadow: ${(props) => props.theme.settings.footerShadow}; */
  border-top: 1px solid var(--ads-v2-color-border);
  z-index: 2;
  background-color: var(--ads-v2-color-bg);
  display: flex;
  flex-direction: row-reverse;
  gap: 16px;
  align-items: center;
`;
