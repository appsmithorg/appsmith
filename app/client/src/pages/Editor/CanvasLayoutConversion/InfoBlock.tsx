import React from "react";
import styled from "styled-components";

import { Colors } from "constants/Colors";
import { Icon } from "design-system";

export type InfoBlockProps = {
  icon: string;
  header: string;
  info: string;
};

const Title = styled.h4`
  color: var(--ads-v2-color-fg-emphasis);
  font-weight: var(--ads-v2-font-weight-bold);
  font-size: var(--ads-v2-font-size-6);
`;

const SubText = styled.p`
  color: var(--ads-v2-color-fg);
  font-weight: var(--ads-v2-font-weight-normal);
  font-size: var(--ads-v2-font-size-4);
`;

const IconWrapper = styled.div`
  height: 40px;
  min-width: 40px;
  border-radius: 9999px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(248, 106, 43, 0.1);
`;

export const InfoBlock = (props: InfoBlockProps) => {
  return (
    <div className="flex flex-row gap-2 pt-3">
      <IconWrapper>
        <Icon
          color={Colors.PRIMARY_ORANGE}
          name="delete-control"
          size="md"
          // withWrapper
          // wrapperColor={Colors.PRIMARY_ORANGE_OPAQUE}
        />
      </IconWrapper>
      <div className="flex flex-col">
        <Title className="pb-1">{props.header}</Title>
        <SubText>{props.info}</SubText>
      </div>
    </div>
  );
};
