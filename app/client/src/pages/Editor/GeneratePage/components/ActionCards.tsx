import React from "react";
import ActionCard from "./ActionCard";
import { FormIcons } from "icons/FormIcons";
import history from "utils/history";
import { BUILDER_PAGE_URL, getGenerateTemplateFormURL } from "constants/routes";
import Icon, { IconSize } from "components/ads/Icon";
import { useParams } from "react-router";
import { ExplorerURLParams } from "../../Explorer/helpers";

type routeId = {
  applicationId: string;
  pageId: string;
};

const routeToEmptyEditorFromGenPage = ({
  applicationId,
  pageId,
}: routeId): void => {
  history.push(BUILDER_PAGE_URL(applicationId, pageId));
};

const goToGenPageForm = ({ applicationId, pageId }: routeId): void => {
  history.push(getGenerateTemplateFormURL(applicationId, pageId));
};

function ActionCards() {
  const { applicationId, pageId } = useParams<ExplorerURLParams>();

  return (
    <>
      <ActionCard
        Icon={FormIcons.CREATE_NEW_ICON}
        onClick={() => routeToEmptyEditorFromGenPage({ applicationId, pageId })}
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
        onClick={() => goToGenPageForm({ applicationId, pageId })}
        subTitle="Start with a simple CRUD UI and customize it"
        title="Generate from a Data Table"
      />
    </>
  );
}

export default ActionCards;
