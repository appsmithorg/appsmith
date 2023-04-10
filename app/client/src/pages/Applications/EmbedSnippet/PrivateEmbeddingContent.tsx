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

function PrivateEmbeddingContent(props: any) {
  const { canMakeAppPublic = false, isAppSettings = false } = props;

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
          Private embedding is only available in Appsmith Business Edition.
        </StyledText>
        <StyledText type={TextType.P1}>
          Apps in community edition need to be public before embedding.
        </StyledText>
      </SubContainer>
      <SubContainer
        className="flex justify-center gap-4"
        isAppSettings={isAppSettings}
      >
        {canMakeAppPublic && (
          <Button
            category={Category.secondary}
            height="36"
            onClick={() => props.setActiveTab(0)}
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
