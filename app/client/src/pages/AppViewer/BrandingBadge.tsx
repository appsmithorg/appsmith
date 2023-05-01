import React from "react";

import { ReactComponent as AppsmithLogo } from "assets/svg/appsmith-logo-no-pad.svg";
import styled from "styled-components";
import { Text } from "design-system";

const Wrapper = styled.span`
  border-radius: var(--ads-v2-border-radius);
  border: 1px solid var(--ads-v2-color-border);
`;

function BrandingBadge() {
  return (
    <Wrapper className="flex items-center p-1 px-2 space-x-2 w-max backdrop-blur-xl backdrop-filter">
      <Text renderAs="h4">Built on</Text>
      <AppsmithLogo className="w-auto h-3" />
    </Wrapper>
  );
}

export default BrandingBadge;
