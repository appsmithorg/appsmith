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
import {
  createMessage,
  IN_APP_EMBED_SETTING,
  UPGRADE,
} from "@appsmith/constants/messages";
import { getAssetUrl } from "@appsmith/utils/airgapHelpers";

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
        src={getAssetUrl(`${ASSETS_CDN_URL}/upgrade-box.svg`)}
        width="119px"
      />
      <SubContainer>
        <StyledText className="upgrade-heading" type={TextType.P1}>
          {createMessage(IN_APP_EMBED_SETTING.upgradeHeading)}
        </StyledText>
        <StyledText type={TextType.P2}>
          {canMakeAppPublic
            ? isAppSettings
              ? createMessage(IN_APP_EMBED_SETTING.upgradeContentForAppSettings)
              : createMessage(IN_APP_EMBED_SETTING.upgradeContentForInviteModal)
            : createMessage(IN_APP_EMBED_SETTING.upgradeContent)}
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
