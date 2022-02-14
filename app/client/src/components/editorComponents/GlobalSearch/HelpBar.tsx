import React from "react";
import { connect } from "react-redux";
import styled from "styled-components";
import { getTypographyByKey } from "constants/DefaultTheme";
import Text, { TextType } from "components/ads/Text";
import { toggleShowGlobalSearchModal } from "actions/globalSearchActions";
import { HELPBAR_PLACEHOLDER } from "@appsmith/constants/messages";
import AnalyticsUtil from "utils/AnalyticsUtil";
import { isMac } from "utils/helpers";
import { filterCategories, SEARCH_CATEGORY_ID } from "./utils";

const StyledHelpBar = styled.div`
  padding: 0 ${(props) => props.theme.spaces[4]}px;
  margin: ${(props) => props.theme.spaces[2]}px;
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
  border: 1.5px solid transparent;
  cursor: default;
  &:hover {
    border: 1.5px solid ${(props) => props.theme.colors.tertiary.light};
  }
`;

export const modText = () => (isMac() ? <span>&#8984;</span> : "Ctrl");
export const altText = () => (isMac() ? <span>&#8997;</span> : "Alt");
const comboText = <>{modText()} + K</>;

type Props = {
  toggleShowModal: () => void;
};

function HelpBar({ toggleShowModal }: Props) {
  return (
    <StyledHelpBar
      className="t--global-search-modal-trigger"
      data-cy="global-search-modal-trigger"
      onClick={toggleShowModal}
    >
      <Text type={TextType.P2}>{HELPBAR_PLACEHOLDER()}</Text>
      <Text italic type={TextType.P3}>
        {comboText}
      </Text>
    </StyledHelpBar>
  );
}

const mapDispatchToProps = (dispatch: any) => ({
  toggleShowModal: () => {
    AnalyticsUtil.logEvent("OPEN_OMNIBAR", { source: "NAVBAR_CLICK" });
    dispatch(
      toggleShowGlobalSearchModal(filterCategories[SEARCH_CATEGORY_ID.INIT]),
    );
  },
});

export default connect(null, mapDispatchToProps)(HelpBar);
