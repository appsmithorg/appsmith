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
}>;

function CardList({ children, isLoading, isMobile, title }: CardListProps) {
  return (
    <CardListContainer isMobile={isMobile}>
      <ResourceHeading isLoading={isLoading}>{title}</ResourceHeading>
      <Space />
      <CardListWrapper isMobile={isMobile}>{children}</CardListWrapper>
    </CardListContainer>
  );
}

export default CardList;
