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
    isAppSettings
      ? `
      padding: 0 16px;
      `
      : `
      > span {
        margin: 0px 0px 8px;
      }

      > span:nth-child(2) {
        margin-bottom: 16px;
      }
  `}
`;

const SubContainer = styled.div<{ isAppSettings?: boolean }>`
  display: flex;
  flex-direction: column;
  gap: 1rem;

  &.button-wrapper {
    display: inline-block;
    margin-top: 8px;
  }
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
      {isAppSettings ? (
        <div>
          <div className="pt-3 pb-3 font-medium text-[color:var(--appsmith-color-black-800)]">
            {createMessage(IN_APP_EMBED_SETTING.embed)}
          </div>
        </div>
      ) : (
        <StyledText
          className={
            !isAppSettings ? "upgrade-heading" : "upgrade-heading-in-app"
          }
          type={TextType.P1}
        >
          {canMakeAppPublic
            ? createMessage(IN_APP_EMBED_SETTING.upgradeHeadingForInviteModal)
            : createMessage(IN_APP_EMBED_SETTING.upgradeHeading)}
        </StyledText>
      )}
      <SubContainer className="flex flex-col">
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
      <SubContainer className="button-wrapper">
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
