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

const ResolveCommentButton = ({ handleClick, resolved }: Props) => {
  return (
    <Container onClick={handleClick}>
      <Icon name="oval-check" size={IconSize.XXL} />
      <span style={{ marginLeft: 4 }}>
        {!resolved ? RESOLVE() : UNRESOLVE()}
      </span>
    </Container>
  );
};

export default ResolveCommentButton;
