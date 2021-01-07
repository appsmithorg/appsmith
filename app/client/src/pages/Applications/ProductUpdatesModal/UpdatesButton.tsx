import React from "react";
import styled from "styled-components";

import Icon, { IconSize } from "components/ads/Icon";

const StyledUpdatesButton = styled.div`
  position: absolute;
  left: 30px;
  bottom: 25px;
  width: 190px;
  height: 38px;
  display: flex;
  align-items: center;
  box-shadow: 0px 12px 34px rgba(0, 0, 0, 0.75);
  padding: 0 ${(props) => props.theme.spaces[4]}px;
  justify-content: space-between;
  cursor: pointer;
`;

const StyledTag = styled.div`
  font-weight: ${(props) => props.theme.typography.p2.fontWeight};
  font-size: ${(props) => props.theme.typography.p2.fontSize}px;
  line-height: ${(props) => props.theme.typography.p2.lineHeight}px;
  letter-spacing: ${(props) => props.theme.typography.p2.letterSpacing}};
  padding: ${(props) => props.theme.spaces[1]}px;
  background: ${(props) => props.theme.colors.floatingBtn.tagBackground};
  border-radius: 100px;
  text-align: center;
  color: white;
`;

const UpdatesButtonTextContainer = styled.div`
  font-weight: ${(props) => props.theme.typography.floatingBtn.fontWeight};
  font-size: ${(props) => props.theme.typography.floatingBtn.fontSize}px;
  line-height: ${(props) => props.theme.typography.floatingBtn.lineHeight}px;
  letter-spacing: ${(props) =>
    props.theme.typography.floatingBtn.letterSpacing}px;
  display: flex;
  align-items: center;
  margin-left: ${(props) => props.theme.spaces[3]}px;
  color: ${(props) => props.theme.colors.text.normal};
`;

const UpdatesButton = ({ newReleasesCount }: { newReleasesCount: string }) => (
  <StyledUpdatesButton>
    <div style={{ display: "flex" }}>
      <Icon name={"success"} size={IconSize.XL} fillColor={"white"} />
      <UpdatesButtonTextContainer>What&apos;s New?</UpdatesButtonTextContainer>
    </div>
    <StyledTag>{newReleasesCount}</StyledTag>
  </StyledUpdatesButton>
);

export default UpdatesButton;
