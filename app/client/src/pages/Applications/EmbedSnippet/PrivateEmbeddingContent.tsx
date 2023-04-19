import React from "react";
import styled from "styled-components";
import { Button, Text, TextType } from "design-system-old";
import {
  createMessage,
  IN_APP_EMBED_SETTING,
} from "@appsmith/constants/messages";
import { getAppsmithConfigs } from "ce/configs";
import { PRICING_PAGE_URL } from "constants/ThirdPartyConstants";
import { useSelector } from "react-redux";
import { getInstanceId } from "ce/selectors/tenantSelectors";

const Container = styled.div<{ isAppSettings: boolean }>`
  ${({ isAppSettings }) =>
    isAppSettings
      ? `
      text-align: left; 
      `
      : `
      text-align: left;

      .no-sub-img {
        margin: auto;
      }
  `}
`;

const SubContainer = styled.div<{ isAppSettings: boolean }>`
  ${({ isAppSettings }) =>
    isAppSettings
      ? `
      > span {
        margin: 8px;
      }
      `
      : `
      > span {
        margin: 8px 0px;
      }

      > span:nth-child(2) {
        margin-bottom: 16px;
      }
  `}
`;

const StyledText = styled(Text)`
  display: block;
  font-size: 14px;

  &.upgrade-heading {
    font-weight: 600;
    font-size: 16px;
  }
`;

const StyledAnchor = styled.a`
  text-decoration: underline;
`;

function PrivateEmbeddingContent(props: {
  canMakeAppPublic: boolean;
  changeTab?: () => void;
  isAppSettings?: boolean;
}) {
  const { canMakeAppPublic = false, changeTab, isAppSettings = false } = props;
  const appsmithConfigs = getAppsmithConfigs();
  const instanceId = useSelector(getInstanceId);

  return (
    <Container data-testid="t--upgrade-content" isAppSettings={isAppSettings}>
      <SubContainer isAppSettings={isAppSettings}>
        <StyledText className="upgrade-heading" type={TextType.P1}>
          {canMakeAppPublic
            ? isAppSettings
              ? createMessage(IN_APP_EMBED_SETTING.upgradeHeadingForAppSettings)
              : createMessage(IN_APP_EMBED_SETTING.upgradeHeadingForInviteModal)
            : createMessage(IN_APP_EMBED_SETTING.upgradeHeading)}
        </StyledText>
        <StyledText type={TextType.P2}>
          {createMessage(IN_APP_EMBED_SETTING.upgradeContent)}&nbsp;
          <StyledAnchor
            onClick={() => {
              window.open(
                PRICING_PAGE_URL(appsmithConfigs.pricingUrl, "CE", instanceId),
                "_blank",
              );
            }}
            rel="noreferrer"
          >
            {createMessage(IN_APP_EMBED_SETTING.appsmithBusinessEdition)}
          </StyledAnchor>
          .
        </StyledText>
      </SubContainer>
      <SubContainer className={`flex`} isAppSettings={isAppSettings}>
        {canMakeAppPublic && !isAppSettings && (
          <Button
            data-testid="t--share-settings-btn"
            height="36"
            onClick={changeTab}
            text="SHARE SETTINGS"
            type="button"
          />
        )}
      </SubContainer>
    </Container>
  );
}

export default PrivateEmbeddingContent;
