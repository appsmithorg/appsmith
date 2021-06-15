import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import styled, { withTheme } from "styled-components";
import Icon, { IconSize } from "components/ads/Icon";
import { Popover2 } from "@blueprintjs/popover2";
import RadioGroup, { Radio } from "components/ads/Radio";
import { Theme } from "constants/DefaultTheme";
import Checkbox from "components/ads/Checkbox";

import {
  shouldShowResolved as shouldShowResolvedSelector,
  appCommentsFilter as appCommentsFilterSelector,
} from "selectors/commentsSelectors";
import {
  setShouldShowResolvedComments,
  setAppCommentsFilter,
} from "actions/commentActions";

import "@blueprintjs/popover2/lib/css/blueprint-popover2.css";

export const options = [
  { label: "Show all comments", value: "show-all" },
  { label: "Show only pinned", value: "show-only-pinned" },
  { label: "Show only yours", value: "show-only-yours" },
];

const checkboxes = [
  { label: "Show resolved comments", value: "show-resolved" },
];

const Container = styled.div`
  width: 180px;
  padding: ${(props) => props.theme.spaces[5]}px;
  && ${Radio} {
    margin-bottom: ${(props) => props.theme.spaces[6]}px;
  }
`;

const Row = styled.div`
  margin-bottom: ${(props) => props.theme.spaces[6]}px;
  &:last-child {
    margin-bottom: 0;
  }
`;

const useSetResolvedFilterFromQuery = () => {
  const dispatch = useDispatch();

  useEffect(() => {
    const url = new URL(window.location.href);
    const searchParams = url.searchParams;
    console.log(window.location.href, "window.location.href");
    if (searchParams.get("isResolved")) {
      dispatch(setShouldShowResolvedComments(true));
    }
  }, []);
};

const AppCommentsFilter = withTheme(({ theme }: { theme: Theme }) => {
  const dispatch = useDispatch();
  const shouldShowResolved = useSelector(shouldShowResolvedSelector);
  const appCommentsFilter = useSelector(appCommentsFilterSelector);

  return (
    <Container>
      <RadioGroup
        backgroundColor={theme.colors.comments.commentsFilter}
        defaultValue={appCommentsFilter}
        onSelect={(value) => dispatch(setAppCommentsFilter(value))}
        options={options}
        rows={3}
      />
      {checkboxes.map(({ label }) => (
        <Row key={label}>
          <Checkbox
            backgroundColor={theme.colors.comments.commentsFilter}
            isDefaultChecked={shouldShowResolved}
            label={label}
            onCheckChange={(isChecked) =>
              dispatch(setShouldShowResolvedComments(isChecked))
            }
          />
        </Row>
      ))}
    </Container>
  );
});

function AppCommentsFilterPopover() {
  useSetResolvedFilterFromQuery();

  return (
    <Popover2
      content={<AppCommentsFilter />}
      modifiers={{
        offset: {
          enabled: true,
          options: {
            offset: [7, 10],
          },
        },
        preventOverflow: {
          enabled: true,
        },
      }}
      placement={"bottom-end"}
      portalClassName="comment-context-menu"
    >
      <Icon name="filter" size={IconSize.LARGE} />
    </Popover2>
  );
}

export default AppCommentsFilterPopover;
