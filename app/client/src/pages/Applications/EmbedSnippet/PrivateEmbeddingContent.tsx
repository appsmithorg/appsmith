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

const appsmithConfigs = getAppsmithConfigs();

const Container = styled.div`
  text-align: center;
`;

const SubContainer = styled.div`
  margin: 16px 0;

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
  const { canMakeAppPublic } = props;

  return (
    <Container>
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
      <SubContainer className="flex justify-center gap-4">
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
          text="UPGRADE"
        />
      </SubContainer>
    </Container>
  );
}

export default PrivateEmbeddingContent;
