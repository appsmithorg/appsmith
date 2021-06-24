import React from "react";
import styled from "styled-components";
import { Colors } from "constants/Colors";
import { getTypographyByKey } from "constants/DefaultTheme";
import Icon, { IconSize } from "components/ads/Icon";

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 10px 20px;
  margin: 0px 10px;
  border: none;
`;

const IconWrapper = styled.div`
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
`;

const RoundBg = styled.div`
  height: 32px;
  width: 32px;
  border-radius: 50%;
  background-color: ${Colors.Gallery};
  display: flex;
  justify-content: center;
  align-items: center;
`;

const DescWrapper = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  margin: 20px 0px;
`;

const Title = styled.p`
  ${(props) => getTypographyByKey(props, "p1")};
  font-weight: 500;
  color: ${Colors.OXFORD_BLUE};
`;

const SubTitle = styled.p`
  ${(props) => getTypographyByKey(props, "p1")};
  color: ${Colors.DARK_GRAY};
`;

function GeneratePageForm() {
  return (
    <div>
      <Wrapper>
        <IconWrapper>
          <RoundBg>
            <Icon
              fillColor={Colors.GRAY2}
              hoverFillColor={Colors.GRAY2}
              name="wand"
              size={IconSize.MEDIUM}
            />
          </RoundBg>
        </IconWrapper>
        <DescWrapper>
          <Title>Generate from Data</Title>
          <SubTitle>
            Connect datasource and we generate the application
          </SubTitle>
        </DescWrapper>
      </Wrapper>
    </div>
  );
}

export default GeneratePageForm;
