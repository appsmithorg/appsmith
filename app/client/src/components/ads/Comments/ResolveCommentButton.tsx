import React from "react";
import styled from "styled-components";
import Icon, { IconSize } from "components/ads/Icon";
import { RESOLVE } from "constants/messages";

const Container = styled.div`
  display: flex;
  cursor: pointer;
`;

type Props = {
  handleClick: () => void;
};

const ResolveCommentButton = ({ handleClick }: Props) => {
  return (
    <Container onClick={handleClick}>
      <Icon name="oval-check" size={IconSize.XXL} />
      <span style={{ marginLeft: 4 }}>{RESOLVE()}</span>
    </Container>
  );
};

export default ResolveCommentButton;
