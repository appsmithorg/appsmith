import React from "react";
import styled from "styled-components";
import { Text } from "@appsmith/ads";
import { Classes as BlueprintClasses } from "@blueprintjs/core";

type ResourceHeadingProps = React.PropsWithChildren<{
  isLoading?: boolean;
}>;

export const CardListContainer = styled.div<{ isMobile?: boolean }>`
  ${({ isMobile }) => (isMobile ? `padding: 0 16px` : `padding-bottom: 24px;`)};
`;

export const CardListWrapper = styled.div<{ isMobile?: boolean }>`
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  font-size: ${(props) => props.theme.fontSizes[4]}px;
`;

export const PaddingWrapper = styled.div<{ isMobile?: boolean }>`
  display: flex;
  align-items: baseline;
  justify-content: center;

  @media screen and (min-width: 1500px) {
    .bp3-card {
      width: ${(props) => props.theme.card.minWidth}px;
      height: ${(props) => props.theme.card.minHeight}px;
    }
  }

  @media screen and (min-width: 1500px) and (max-width: 1512px) {
    .bp3-card {
      width: ${(props) => props.theme.card.minWidth - 5}px;
      height: ${(props) => props.theme.card.minHeight - 5}px;
    }
  }
  @media screen and (min-width: 1478px) and (max-width: 1500px) {
    .bp3-card {
      width: ${(props) => props.theme.card.minWidth - 8}px;
      height: ${(props) => props.theme.card.minHeight - 8}px;
    }
  }

  @media screen and (min-width: 1447px) and (max-width: 1477px) {
    .bp3-card {
      width: ${(props) => props.theme.card.minWidth - 8}px;
      height: ${(props) => props.theme.card.minHeight - 8}px;
    }
  }

  @media screen and (min-width: 1417px) and (max-width: 1446px) {
    .bp3-card {
      width: ${(props) => props.theme.card.minWidth - 11}px;
      height: ${(props) => props.theme.card.minHeight - 11}px;
    }
  }

  @media screen and (min-width: 1400px) and (max-width: 1417px) {
    .bp3-card {
      width: ${(props) => props.theme.card.minWidth - 15}px;
      height: ${(props) => props.theme.card.minHeight - 15}px;
    }
  }

  @media screen and (max-width: 1400px) {
    .bp3-card {
      width: ${(props) => props.theme.card.minWidth - 15}px;
      height: ${(props) => props.theme.card.minHeight - 15}px;
    }
  }

  ${({ isMobile }) =>
    isMobile &&
    `
    width: 100% !important;
  `}
`;

const StyledResourceHeadingText = styled(Text)`
  font-weight: var(--ads-font-weight-bold-xl);
  display: flex;
  justify-content: flex-start;
  align-items: center;
  gap: 10px;
`;

export const Space = styled.div`
  margin-bottom: 10px;
`;

export function ResourceHeading({
  children,
  isLoading = false,
}: ResourceHeadingProps) {
  return (
    <StyledResourceHeadingText
      className={isLoading ? BlueprintClasses.SKELETON : ""}
      kind="heading-s"
    >
      {children}
    </StyledResourceHeadingText>
  );
}
