import React from "react";
import { connect } from "react-redux";
import styled from "styled-components";
import { getTypographyByKey, Text, TextType } from "design-system-old";
import { setGlobalSearchCategory } from "actions/globalSearchActions";
import { HELPBAR_PLACEHOLDER } from "@appsmith/constants/messages";
import AnalyticsUtil from "utils/AnalyticsUtil";
import { modText } from "utils/helpers";
import { filterCategories, SEARCH_CATEGORY_ID } from "./utils";
import { Colors } from "constants/Colors";

const StyledHelpBar = styled.div`
  padding: 0 ${(props) => props.theme.spaces[4]}px;
  margin: ${(props) => props.theme.spaces[2]}px;
  .placeholder-text {
    ${getTypographyByKey("p2")}
  }
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: var(--ads-v2-color-fg);
  height: 28px;
  flex: 1;
  max-width: 205px;
  border: 1px solid var(--ads-v2-color-border);
  border-radius: var(--ads-v2-border-radius);
  cursor: pointer;
  &:hover {
    border: 1px solid var(--ads-v2-color-border-emphasis);
  }
`;

const comboText = <>{modText()} K</>;

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
      <Text color={Colors.GRAY_400} type={TextType.P2}>
        {HELPBAR_PLACEHOLDER()}
      </Text>
      <Text color={Colors.GRAY_400} italic type={TextType.P3}>
        {comboText}
      </Text>
    </StyledHelpBar>
  );
}

const mapDispatchToProps = (dispatch: any) => ({
  toggleShowModal: () => {
    AnalyticsUtil.logEvent("OPEN_OMNIBAR", { source: "NAVBAR_CLICK" });
    dispatch(
      setGlobalSearchCategory(filterCategories[SEARCH_CATEGORY_ID.INIT]),
    );
  },
});

export default connect(null, mapDispatchToProps)(HelpBar);
