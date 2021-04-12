import React from "react";
import styled from "styled-components";
import Icon, { IconSize } from "components/ads/Icon";
import { RESOLVE, UNRESOLVE } from "constants/messages";

const Container = styled.div`
  display: flex;
  cursor: pointer;
`;

type Props = {
  handleClick: () => void;
  resolved: boolean;
};

const BtnContainer = styled.span`
  margin-left: ${(props) => props.theme.spaces[2]}px;
`;

const ResolveCommentButton = ({ handleClick, resolved }: Props) => {
  return (
    <Container onClick={handleClick}>
      <Icon name="oval-check" size={IconSize.XXL} />
      <BtnContainer>{!resolved ? RESOLVE() : UNRESOLVE()}</BtnContainer>
    </Container>
  );
};

export default ResolveCommentButton;
