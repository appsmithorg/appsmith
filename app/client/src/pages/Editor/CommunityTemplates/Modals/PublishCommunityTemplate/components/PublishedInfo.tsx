import { COMMUNITY_TEMPLATES, createMessage } from "ee/constants/messages";
import { Icon, Text } from "@appsmith/ads";
import React, { useCallback } from "react";
import styled from "styled-components";

const PublishedInfo = () => {
  const getItem = useCallback(
    (text: () => string, index: number, correct: boolean) => (
      <ItemWrapper key={index}>
        <Icon
          color={
            correct
              ? "var(--ads-v2-color-fg-success)"
              : "var(--ads-v2-color-fg-error)"
          }
          name={correct ? "check-line" : "close"}
        />
        <Text kind="body-m" renderAs="p">
          {createMessage(text)}
        </Text>
      </ItemWrapper>
    ),
    [],
  );

  return (
    <Container>
      <Text kind="heading-s" renderAs="h2">
        {createMessage(COMMUNITY_TEMPLATES.publishFormPage.publishedInfo.title)}
      </Text>
      {COMMUNITY_TEMPLATES.publishFormPage.publishedInfo.correct.map(
        (item, index) => getItem(item, index, true),
      )}
      {COMMUNITY_TEMPLATES.publishFormPage.publishedInfo.incorrect.map(
        (item, index) => getItem(item, index, false),
      )}
    </Container>
  );
};

export default PublishedInfo;

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const ItemWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 14px;
`;
