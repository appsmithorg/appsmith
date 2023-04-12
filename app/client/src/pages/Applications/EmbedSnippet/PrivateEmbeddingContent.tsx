import React from "react";
import styled from "styled-components";
import { ASSETS_CDN_URL } from "constants/ThirdPartyConstants";
import {
  Button,
  Category,
  IconPositions,
  Text,
  TextType,
} from "design-system-old";
import { getAppsmithConfigs } from "@appsmith/configs";
import { createMessage, UPGRADE } from "@appsmith/constants/messages";

const appsmithConfigs = getAppsmithConfigs();

const Container = styled.div<{ isAppSettings: boolean }>`
  ${({ isAppSettings }) =>
    isAppSettings
      ? `
      padding: 16px; 
      text-align: left; 
      `
      : `
      text-align: center;

      .no-sub-img {
        margin: auto;
      }
  `}
`;

const SubContainer = styled.div`
  margin: 16px 0;

  > span {
    margin: 8px 0;
  }
`;

const StyledText = styled(Text)`
  display: block;

  &.upgrade-heading {
    font-weight: 600;
  }
`;

function PrivateEmbeddingContent(props: {
  canMakeAppPublic: boolean;
  changeTab?: () => void;
  isAppSettings?: boolean;
}) {
  const { canMakeAppPublic = false, changeTab, isAppSettings = false } = props;

  return (
    <Container data-testid="t--upgrade-content" isAppSettings={isAppSettings}>
      <img
        alt={"Upgrade"}
        className="no-sub-img"
        height="108px"
        src={`${ASSETS_CDN_URL}/upgrade-box.svg`}
        width="119px"
      />
      <SubContainer>
        <StyledText className="upgrade-heading" type={TextType.P1}>
          Private embedding is only available on self-hosted Business Edition of
          Appsmith
        </StyledText>
        <StyledText type={TextType.P2}>
          {canMakeAppPublic
            ? isAppSettings
              ? "To embed your app, make it public by toggling the switch above."
              : "To embed your app, make it public in the share settings."
            : "Please contact your workspace admin to make the app public."}
        </StyledText>
      </SubContainer>
      <SubContainer
        className={`flex gap-4 ${!isAppSettings && "justify-center"}`}
      >
        {canMakeAppPublic && !isAppSettings && (
          <Button
            category={Category.secondary}
            data-testid="t--share-settings-btn"
            height="36"
            onClick={changeTab}
            text="SHARE SETTINGS"
            type="button"
          />
        )}
        <Button
          data-testid="t--upgrade-btn"
          height="36"
          href={`${appsmithConfigs.customerPortalUrl}/plans`}
          icon="external-link-line"
          iconPosition={IconPositions.left}
          target="_blank"
          text={createMessage(UPGRADE)}
        />
      </SubContainer>
    </Container>
  );
}

export default PrivateEmbeddingContent;
