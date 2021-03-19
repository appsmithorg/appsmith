import React from "react";
import { connect } from "react-redux";
import styled from "styled-components";
import { getTypographyByKey } from "constants/DefaultTheme";
import Text, { TextType } from "components/ads/Text";
import { toggleShowGlobalSearchModal } from "actions/globalSearchActions";
import { HELPBAR_PLACEHOLDER } from "constants/messages";
import AnalyticsUtil from "utils/AnalyticsUtil";
import { isMac } from "utils/helpers";

const StyledHelpBar = styled.div`
  padding: 0 ${(props) => props.theme.spaces[4]}px;
  .placeholder-text {
    ${(props) => getTypographyByKey(props, "p2")}
  }
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: ${(props) => props.theme.colors.globalSearch.helpBarText};
  background: ${(props) => props.theme.colors.globalSearch.helpBarBackground};
  height: 28px;
  flex: 1;
  max-width: 350px;
`;

const modText = () => (isMac() ? <span>&#8984;</span> : "ctrl");
const comboText = <>{modText()} + K</>;

type Props = {
  toggleShowModal: () => void;
};

const HelpBar = ({ toggleShowModal }: Props) => {
  return (
    <StyledHelpBar
      onClick={toggleShowModal}
      className="t--global-search-modal-trigger"
    >
      <Text type={TextType.P2}>{HELPBAR_PLACEHOLDER()}</Text>
      <Text type={TextType.P3} italic>
        {comboText}
      </Text>
    </StyledHelpBar>
  );
};

const mapDispatchToProps = (dispatch: any) => ({
  toggleShowModal: () => {
    AnalyticsUtil.logEvent("OPEN_OMNIBAR", { source: "NAVBAR_CLICK" });
    dispatch(toggleShowGlobalSearchModal());
  },
});

export default connect(null, mapDispatchToProps)(HelpBar);
