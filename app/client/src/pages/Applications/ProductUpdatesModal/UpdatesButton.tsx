import React from "react";
import styled from "styled-components";
import { HelpIcons } from "icons/HelpIcons";
import { Colors } from "constants/Colors";
import { withTheme } from "styled-components";

const StyledUpdatesButton = styled.div`
  position: absolute;
  left: 30px;
  bottom: 25px;
  width: 190px;
  height: 38px;
  display: flex;
  align-items: center;
  box-shadow: 0px 12px 34px rgba(0, 0, 0, 0.75);
  padding: 0 ${(props) => props.theme.spaces[5]}px;
  justify-content: space-between;
  cursor: pointer;
  background-color: ${(props) =>
    props.theme.colors.floatingBtn.backgroundColor};
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
  color: ${Colors.WHITE};
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

const UpdatesIcon = withTheme(({ theme }) => (
  <HelpIcons.UPDATES
    height={12}
    width={13}
    color={theme.colors.floatingBtn.iconColor}
  />
));

const UpdatesButton = ({ newReleasesCount }: { newReleasesCount: string }) => (
  <StyledUpdatesButton>
    <div style={{ display: "flex" }}>
      <UpdatesIcon />
      <UpdatesButtonTextContainer>What&apos;s New?</UpdatesButtonTextContainer>
    </div>
    {newReleasesCount && <StyledTag>{newReleasesCount}</StyledTag>}
  </StyledUpdatesButton>
);

export default UpdatesButton;
