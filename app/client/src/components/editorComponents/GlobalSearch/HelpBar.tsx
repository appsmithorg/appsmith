import React from "react";
import styled from "styled-components";
import { connect } from "react-redux";
import { getTypographyByKey, Text, TextType } from "design-system-old";
import { Icon } from "design-system";
import { setGlobalSearchCategory } from "actions/globalSearchActions";
import { HELPBAR_PLACEHOLDER } from "@appsmith/constants/messages";
import AnalyticsUtil from "utils/AnalyticsUtil";
import { modText } from "utils/helpers";
import { filterCategories, SEARCH_CATEGORY_ID } from "./utils";
import { protectedModeSelector } from "selectors/gitSyncSelectors";
import type { AppState } from "@appsmith/reducers";
import { useFeatureFlag } from "utils/hooks/useFeatureFlag";
import { FEATURE_FLAG } from "@appsmith/entities/FeatureFlag";

const StyledHelpBar = styled.button<{ maxWidth?: string }>`
  padding: 0 var(--ads-v2-spaces-3);
  margin: var(--ads-v2-spaces-2);
  .placeholder-text {
    ${getTypographyByKey("p2")}
  }
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 28px;
  flex: 1;
  max-width: ${({ maxWidth }) => (maxWidth ? maxWidth : "210px")};
  border: 1px solid var(--ads-v2-color-border);
  border-radius: var(--ads-v2-border-radius);
  background-color: var(--ads-v2-color-bg);
  font-family: var(--ads-v2-font-family);
  font-size: var(--ads-v2-font-size-4);
  color: var(--ads-v2-color-fg);
  &:hover {
    border: 1px solid var(--ads-v2-color-border-emphasis-plus);
  }

  &:disabled,
  &[disabled] {
    cursor: not-allowed;
  }
`;

interface Props {
  toggleShowModal: () => void;
  isProtectedMode: boolean;
}

function HelpBar({ isProtectedMode, toggleShowModal }: Props) {
  const isSideBySideFlagEnabled = useFeatureFlag(
    FEATURE_FLAG.release_side_by_side_ide_enabled,
  );

  return (
    <StyledHelpBar
      className="t--global-search-modal-trigger"
      data-testid="global-search-modal-trigger"
      disabled={isProtectedMode}
      maxWidth={isSideBySideFlagEnabled ? "70px" : "210px"}
      onClick={toggleShowModal}
    >
      {!isSideBySideFlagEnabled && (
        <Text type={TextType.P2}>{HELPBAR_PLACEHOLDER()}</Text>
      )}
      {isSideBySideFlagEnabled && <Icon name={"search-line"} size={"md"} />}
      <Text italic type={TextType.P3}>
        {modText()} K
      </Text>
    </StyledHelpBar>
  );
}

const mapStateToProps = (state: AppState) => ({
  isProtectedMode: protectedModeSelector(state),
});

const mapDispatchToProps = (dispatch: any) => ({
  toggleShowModal: () => {
    AnalyticsUtil.logEvent("OPEN_OMNIBAR", { source: "NAVBAR_CLICK" });
    dispatch(
      setGlobalSearchCategory(filterCategories[SEARCH_CATEGORY_ID.INIT]),
    );
  },
});

export default connect(mapStateToProps, mapDispatchToProps)(HelpBar);
