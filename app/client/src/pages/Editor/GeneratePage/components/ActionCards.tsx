import React from "react";
import ActionCard from "./ActionCard";
import styled from "constants/DefaultTheme";
import { Colors } from "constants/Colors";
import { FormIcons } from "icons/FormIcons";
import history from "utils/history";
import { GEN_TEMPLATE_URL } from "../../../../constants/routes";
import Icon, { IconSize } from "components/ads/Icon";

const Separator = styled.div`
  width: 1px;
  background-color: ${Colors.MERCURY};
`;

export const routeToEmptyEditorFromGenPage = (): void => {
  const currentPath = window.location.pathname;
  const routes = currentPath.split(GEN_TEMPLATE_URL);
  const removedGenPageRoute = routes[0];

  history.replace({
    ...window.location,
    pathname: removedGenPageRoute,
  });
};

const AddParamToShowGenForm = (): void => {
  const currentPath = window.location.pathname;
  const addFormRoute = currentPath + "/form";
  history.replace({
    ...window.location,
    pathname: addFormRoute,
  });
};

function ActionCards() {
  return (
    <>
      <ActionCard
        Icon={FormIcons.CREATE_NEW_ICON}
        onClick={routeToEmptyEditorFromGenPage}
        subTitle="Add datasources and then connect to widgets manually"
        title="Build it From Scratch"
      />
      <Separator />
      <ActionCard
        Icon={({ color }) => (
          <Icon
            fillColor={color}
            hoverFillColor={color}
            name="wand"
            size={IconSize.MEDIUM}
          />
        )}
        onClick={AddParamToShowGenForm}
        subTitle="Connect datasource and we generate the application"
        title="Generate from Data"
      />
    </>
  );
}

export default ActionCards;
