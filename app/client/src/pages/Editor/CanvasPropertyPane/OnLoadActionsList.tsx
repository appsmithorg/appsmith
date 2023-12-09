import React from "react";
import styled from "styled-components";
import { useSelector } from "react-redux";
import type {
  // LayoutOnLoadActionErrors,
  PageAction,
} from "constants/AppsmithActionConstants/ActionConstants";
import {
  getLayoutOnLoadActions,
  // getLayoutOnLoadIssues,
} from "selectors/editorSelectors";
import { Collapsible, CollapsibleHeader, Text } from "design-system";

const Title = styled.p`
  color: var(--ads-v2-color-fg);
`;
const OnLoadActionsList = () => {
  const pageActions: PageAction[][] = useSelector(getLayoutOnLoadActions);
  // console.log({ pageActions });
  // const layoutOnLoadActionErrors: LayoutOnLoadActionErrors[] = useSelector(
  //   getLayoutOnLoadIssues,
  // );
  // const orderedActions =
  return (
    <div>
      <Title className="text-sm">On page load</Title>
      {pageActions.map((actionList) => (
        <Collapsible key={actionList[0].id}>
          <CollapsibleHeader>
            <Text kind={"heading-s"}>
              {actionList.map((action) => action.name).join(", ")}
            </Text>
          </CollapsibleHeader>
        </Collapsible>
      ))}
    </div>
  );
};

export default OnLoadActionsList;
