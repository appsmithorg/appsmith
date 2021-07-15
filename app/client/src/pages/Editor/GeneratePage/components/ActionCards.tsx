import React from "react";
import ActionCard from "./ActionCard";
import { FormIcons } from "icons/FormIcons";
import history from "utils/history";
import { GEN_TEMPLATE_URL } from "../../../../constants/routes";
import Icon, { IconSize } from "components/ads/Icon";

const routeToEmptyEditorFromGenPage = (): void => {
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
        subTitle="Start from scratch and create your custom UI"
        title="Build with Drag & Drop"
      />

      <ActionCard
        Icon={({ color }) => (
          <Icon
            fillColor={color}
            hoverFillColor={color}
            name="wand"
            size={IconSize.LARGE}
          />
        )}
        onClick={AddParamToShowGenForm}
        subTitle="Start with a simple CRUD UI and customize it"
        title="Generate from a Data Table"
      />
    </>
  );
}

export default ActionCards;
