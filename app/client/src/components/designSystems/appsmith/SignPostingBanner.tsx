import React from "react";
import type { ReactNode } from "react";
import styled from "styled-components";
import { Icon } from "@appsmith/ads";

export interface SignPostingBannerProps {
  iconName: string;
  content: ReactNode;
}

export const Container = styled.div`
  background-color: var(--ads-v2-color-blue-100);
  width: 100%;
  display: flex;
`;

function SignPostingBanner(props: SignPostingBannerProps) {
  return (
    <Container className="py-2 px-3 rounded">
      <div className="flex items-start">
        <Icon
          className="font-semibold mr-2 flex items-start mt-0.5"
          color="var(--ads-v2-color-fg-information)"
          name={props.iconName}
          size="md"
        />
      </div>
      {props.content}
    </Container>
  );
}

export default SignPostingBanner;
