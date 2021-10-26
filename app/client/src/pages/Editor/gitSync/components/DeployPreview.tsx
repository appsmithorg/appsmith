import React from "react";

import styled from "styled-components";
import { ReactComponent as CloudyIcon } from "assets/icons/ads/cloudy-line.svg";
import { ReactComponent as RightArrow } from "assets/icons/ads/arrow-right-line.svg";

// import AnalyticsUtil from "utils/AnalyticsUtil";
import { getApplicationViewerPageURL } from "constants/routes";
import { useSelector } from "store";
import {
  getCurrentApplicationId,
  getCurrentPageId,
} from "selectors/editorSelectors";
import {
  LATEST_DP_TITLE,
  LATEST_DP_SUBTITLE,
  createMessage,
} from "constants/messages";
import Text, { TextType, Case } from "components/ads/Text";
import { Colors } from "constants/Colors";

const Container = styled.div`
  display: flex;
  flex: 1;
  flex-direction: row;
  position: absolute;

  
  /* bottom: ${(props) => `${props.theme.spaces[8]}px`}; */
  bottom: 30px;
  width: calc(100% - 30px);
 
`;

const ButtonWrapper = styled.div`
  display: flex;
  flex-direction: row;
  padding-top: 2px;
  cursor: pointer;
`;

const IconWrapper = styled.div`
  margin-left: 2px;
  justify-content: center;
  align-items: center;
  display: flex;
  svg {
    path {
      fill: ${Colors.GREY_9};
    }
  }
`;

const ContentWrapper = styled.div`
  margin-left: ${(props) => props.theme.spaces[6]}px;
`;

const CloudIconWrapper = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
`;

export default function DeployPreview() {
  const applicationId = useSelector(getCurrentApplicationId);
  const pageId = useSelector(getCurrentPageId);

  const showDeployPreview = () => {
    const path = getApplicationViewerPageURL({ applicationId, pageId });
    window.open(path, "_blank");
  };

  return (
    <Container>
      <CloudIconWrapper>
        <CloudyIcon />
      </CloudIconWrapper>
      <ContentWrapper>
        <ButtonWrapper onClick={showDeployPreview}>
          <Text
            case={Case.UPPERCASE}
            color={Colors.GREY_9}
            type={TextType.P1}
            weight="600"
          >
            {createMessage(LATEST_DP_TITLE)}
          </Text>
          <IconWrapper>
            <RightArrow width={20} />
          </IconWrapper>
        </ButtonWrapper>
        <Text color={Colors.GREY_6} type={TextType.P3}>
          {createMessage(LATEST_DP_SUBTITLE)}
        </Text>
      </ContentWrapper>
    </Container>
  );
}
