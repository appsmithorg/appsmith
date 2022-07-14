import React from "react";
import styled from "styled-components";
import { Classes } from "@blueprintjs/core";
import { Icon, IconSize } from "components/ads";

export const Wrapper = styled.div`
  flex-basis: calc(100% - ${(props) => props.theme.homePage.leftPane.width}px);
  margin-left: ${(props) => props.theme.homePage.main.marginLeft}px;
  padding-top: 40px;
  height: calc(100vh - ${(props) => props.theme.homePage.header}px);
  overflow: auto;
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

export const StyledBackButton = styled.div`
  display: flex;
  cursor: pointer;
  margin: 0 0 20px 0;
`;

export const BackButtonText = styled.span`
  margin: 0 0 0 8px;
`;

export function BackButton() {
  const onBack = () => {
    history.back();
  };

  return (
    <StyledBackButton
      className="t--admin-settings-back-button"
      onClick={onBack}
    >
      <Icon name="chevron-left" size={IconSize.XS} />
      <BackButtonText>Back</BackButtonText>
    </StyledBackButton>
  );
}
