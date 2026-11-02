import React from "react";
import styled from "styled-components";
import { Tag } from "@appsmith/ads";
import { createMessage, PREVIEW_TAG } from "ee/constants/messages";

const TitleTag = styled(Tag)`
  max-width: fit-content;
`;

export default function PreviewTag() {
  return (
    <TitleTag isClosable={false} size="md">
      {createMessage(PREVIEW_TAG)}
    </TitleTag>
  );
}
