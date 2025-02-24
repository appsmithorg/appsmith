import React from "react";
import { getPostRunActionName } from "../utils/postRunActionsUtil";
import styled from "styled-components";
import { PostRunActionComponentMap } from "ee/components/PostActionRunComponents";
import type { PostRunActionNamesInterface } from "ee/components/PostActionRunComponents/types";
import type { PostActionRunConfig } from "api/types";

interface Props {
  postRunAction?: PostActionRunConfig;
}

const Container = styled.div`
  border: 1px solid var(--ads-v2-color-border);
  z-index: 100;
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: auto;
  padding-bottom: var(--ads-bottom-bar-height);
  background-color: var(--ads-v2-color-bg);
`;

export default function PostActionRunContainer({ postRunAction }: Props) {
  if (!postRunAction) {
    return null;
  }

  const name: string = getPostRunActionName(postRunAction);
  const Component = PostRunActionComponentMap[
    name as PostRunActionNamesInterface
  ] as React.ComponentType;

  if (!Component) {
    return null;
  }

  return (
    <Container data-testid="t--post-run-action-container">
      <Component />
    </Container>
  );
}
