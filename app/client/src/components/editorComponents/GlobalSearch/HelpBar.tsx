import React from "react";
import { connect } from "react-redux";
import styled from "styled-components";
import { getTypographyByKey } from "constants/DefaultTheme";
import Text, { TextType } from "components/ads/Text";
import { toggleShowGlobalSearchModal } from "actions/globalSearchActions";

const StyledHelpBar = styled.div`
  padding: 0 ${(props) => props.theme.spaces[4]}px;
  .placeholder-text {
    ${(props) => getTypographyByKey(props, "p2")}
  }
  display: flex;
  justify-content: space-between;
  align-items: center;
  min-width: 266px;
  border: 1px solid ${(props) => props.theme.colors.globalSearch.helpBarBorder};
  color: ${(props) => props.theme.colors.globalSearch.helpBarText};
  height: 28px;
`;

const placeholderText = "Search, Add & Navigate";
const comboText = (
  <>
    <kbd>Shift</kbd> + <kbd>O</kbd>
  </>
);

type Props = {
  toggleShowModal: () => void;
};

const HelpBar = ({ toggleShowModal }: Props) => {
  return (
    <StyledHelpBar onClick={toggleShowModal}>
      <Text type={TextType.P2}>{placeholderText}</Text>
      <Text type={TextType.P3} italic>
        {comboText}
      </Text>
    </StyledHelpBar>
  );
};

const mapDispatchToProps = (dispatch: any) => ({
  toggleShowModal: () => dispatch(toggleShowGlobalSearchModal()),
});

export default connect(null, mapDispatchToProps)(HelpBar);
