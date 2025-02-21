import type { ActionResponse } from "api/ActionAPI";
import type { Action } from "entities/Action";
import { getPostRunActionName } from "../utils/checkForPostRunAction";
import React from "react";
import styled from "styled-components";
import { PostRunActionComponentMap } from "ee/components/PostActionRunComponents";
import type { PostRunActionNamesInterface } from "ee/components/PostActionRunComponents/types";

interface Props {
  action: Action;
  actionResponse?: ActionResponse;
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

export default function PostActionRunContainer({
  action,
  actionResponse,
}: Props) {
  if (!actionResponse?.postRunAction) {
    return null;
  }

  const { postRunAction } = actionResponse;
  const name: string = getPostRunActionName(postRunAction);
  const Component = PostRunActionComponentMap[
    name as PostRunActionNamesInterface
  ] as React.ComponentType<{
    action: Action;
    actionResponse: ActionResponse;
  }>;

  if (!Component) {
    return null;
  }

  return (
    <Container>
      <Component action={action} actionResponse={actionResponse} />
    </Container>
  );
}
