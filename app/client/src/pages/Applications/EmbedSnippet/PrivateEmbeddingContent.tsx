import React from "react";
import { useSelector } from "react-redux";
import styled from "styled-components";
import { Button, Text, TextType } from "design-system-old";
import { PRICING_PAGE_URL } from "constants/ThirdPartyConstants";
import {
  createMessage,
  IN_APP_EMBED_SETTING,
} from "@appsmith/constants/messages";
import { getAppsmithConfigs } from "@appsmith/configs";
import { getInstanceId } from "@appsmith/selectors/tenantSelectors";

const Container = styled.div<{ isAppSettings: boolean }>`
  text-align: left;
  ${({ isAppSettings }) =>
    !isAppSettings &&
    `
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
        margin: 1rem;
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

  &.upgrade-heading-in-app {
    font-weight: 500;
    text-color: var(--appsmith-color-black-800);
  }

  &.secondary-heading {
    font-weight: 500;
    text-color: var(--appsmith-color-black-800);
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
        <StyledText
          className={
            !isAppSettings ? "upgrade-heading" : "upgrade-heading-in-app"
          }
          type={TextType.P1}
        >
          {canMakeAppPublic
            ? isAppSettings
              ? createMessage(IN_APP_EMBED_SETTING.upgradeHeadingForAppSettings)
              : createMessage(IN_APP_EMBED_SETTING.upgradeHeadingForInviteModal)
            : isAppSettings
            ? createMessage(IN_APP_EMBED_SETTING.upgradeHeadingForAppSettings)
            : createMessage(IN_APP_EMBED_SETTING.upgradeHeading)}
        </StyledText>
        {isAppSettings && (
          <StyledText className="secondary-heading" type={TextType.P2}>
            {canMakeAppPublic
              ? createMessage(
                  IN_APP_EMBED_SETTING.secondaryHeadingForAppSettings,
                )
              : createMessage(IN_APP_EMBED_SETTING.secondaryHeading)}
          </StyledText>
        )}
        <StyledText type={TextType.P2}>
          {createMessage(IN_APP_EMBED_SETTING.upgradeContent)}&nbsp;
          <StyledAnchor
            onClick={() => {
              window.open(
                PRICING_PAGE_URL(
                  appsmithConfigs.pricingUrl,
                  appsmithConfigs.cloudHosting ? "Cloud" : "CE",
                  instanceId,
                ),
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
      <SubContainer className="flex" isAppSettings={isAppSettings}>
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
