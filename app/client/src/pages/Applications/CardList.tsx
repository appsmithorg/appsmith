import type { ReactNode } from "react";
import React from "react";
import {
  CardListContainer,
  CardListWrapper,
  ResourceHeading,
  Space,
} from "pages/Applications/CommonElements";

type CardListProps = React.PropsWithChildren<{
  isLoading?: boolean;
  isMobile?: boolean;
  title: string;
  titleTag?: ReactNode;
}>;

function CardList({
  children,
  isLoading,
  isMobile,
  title,
  titleTag,
}: CardListProps) {
  return (
    <CardListContainer isMobile={isMobile}>
      <ResourceHeading isLoading={isLoading}>
        {title}
        {titleTag}
      </ResourceHeading>
      <Space />
      <CardListWrapper isMobile={isMobile}>{children}</CardListWrapper>
    </CardListContainer>
  );
}

export default CardList;
