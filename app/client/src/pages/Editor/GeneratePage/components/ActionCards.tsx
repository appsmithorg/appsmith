import React from "react";
import ActionCard from "./ActionCard";
import { FormIcons } from "icons/FormIcons";
import history from "utils/history";
import Icon, { IconSize } from "components/ads/Icon";
import { useParams } from "react-router";
import { ExplorerURLParams } from "../../Explorer/helpers";
import {
  GENERATE_PAGE_ACTION_SUBTITLE,
  GENERATE_PAGE_ACTION_TITLE,
  BUILD_FROM_SCRATCH_ACTION_TITLE,
  BUILD_FROM_SCRATCH_ACTION_SUBTITLE,
} from "@appsmith/constants/messages";
import AnalyticsUtil from "utils/AnalyticsUtil";
import { builderURL, generateTemplateFormURL } from "RouteBuilder";

type routeId = {
  pageId: string;
};

const routeToEmptyEditorFromGenPage = ({ pageId }: routeId): void => {
  AnalyticsUtil.logEvent("BUILD_FROM_SCRATCH_ACTION_CARD_CLICK");
  history.push(builderURL({ pageId }));
};

const goToGenPageForm = ({ pageId }: routeId): void => {
  AnalyticsUtil.logEvent("GEN_CRUD_PAGE_ACTION_CARD_CLICK");
  history.push(generateTemplateFormURL({ pageId }));
};

function ActionCards() {
  const { pageId } = useParams<ExplorerURLParams>();

  return (
    <>
      <ActionCard
        Icon={FormIcons.CREATE_NEW_ICON}
        className="t--BuildFromScratch"
        onClick={() =>
          routeToEmptyEditorFromGenPage({
            pageId,
          })
        }
        subTitle={BUILD_FROM_SCRATCH_ACTION_SUBTITLE()}
        title={BUILD_FROM_SCRATCH_ACTION_TITLE()}
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
        className="t--GenerateCRUDPage"
        onClick={() => goToGenPageForm({ pageId })}
        subTitle={GENERATE_PAGE_ACTION_SUBTITLE()}
        title={GENERATE_PAGE_ACTION_TITLE()}
      />
    </>
  );
}

export default ActionCards;
