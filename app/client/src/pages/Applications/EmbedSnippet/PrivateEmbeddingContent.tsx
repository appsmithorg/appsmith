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
  text-align: center;

  ${({ isAppSettings }) => isAppSettings && `padding: 16px;`}
`;

const SubContainer = styled.div<{ isAppSettings?: boolean }>`
  margin: 16px 0;

  ${({ isAppSettings }) => isAppSettings && `flex-direction: column;`}

  > span {
    margin: 8px 0;
  }
`;

const StyledText = styled(Text)`
  display: block;
`;

const Image = styled.img`
  margin: auto;
`;

function PrivateEmbeddingContent(props: {
  canMakeAppPublic: boolean;
  changeTab?: () => void;
  isAppSettings?: boolean;
}) {
  const { canMakeAppPublic = false, changeTab, isAppSettings = false } = props;

  return (
    <Container isAppSettings={isAppSettings}>
      <Image
        alt={"Upgrade"}
        className="no-sub-img"
        height="108px"
        src={`${ASSETS_CDN_URL}/upgrade-box.svg`}
        width="108px"
      />
      <SubContainer>
        <StyledText type={TextType.P0}>
          Private embedding is only available on self-hosted Business Edition of
          Appsmith
        </StyledText>
        <StyledText type={TextType.P1}>
          {canMakeAppPublic
            ? "To embed your app, make it public in the share settings."
            : "Please contact your workspace admin to make the app public."}
        </StyledText>
      </SubContainer>
      <SubContainer
        className="flex justify-center gap-4"
        isAppSettings={isAppSettings}
      >
        {canMakeAppPublic && !isAppSettings && (
          <Button
            category={Category.secondary}
            height="36"
            onClick={changeTab}
            text="SHARE SETTINGS"
            type="button"
          />
        )}
        <Button
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
