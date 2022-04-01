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
import { useSelector } from "react-redux";
import { selectURLSlugs } from "selectors/editorSelectors";
import { builderURL, generateTemplateFormURL } from "RouteBuilder";

type routeId = {
  applicationSlug: string;
  pageId: string;
  pageSlug: string;
};

const routeToEmptyEditorFromGenPage = ({
  applicationSlug,
  pageId,
  pageSlug,
}: routeId): void => {
  AnalyticsUtil.logEvent("BUILD_FROM_SCRATCH_ACTION_CARD_CLICK");
  history.push(builderURL({ applicationSlug, pageSlug, pageId }));
};

const goToGenPageForm = ({
  applicationSlug,
  pageId,
  pageSlug,
}: routeId): void => {
  AnalyticsUtil.logEvent("GEN_CRUD_PAGE_ACTION_CARD_CLICK");
  history.push(generateTemplateFormURL({ applicationSlug, pageSlug, pageId }));
};

function ActionCards() {
  const { pageId } = useParams<ExplorerURLParams>();
  const { applicationSlug, pageSlug } = useSelector(selectURLSlugs);

  return (
    <>
      <ActionCard
        Icon={FormIcons.CREATE_NEW_ICON}
        className="t--BuildFromScratch"
        onClick={() =>
          routeToEmptyEditorFromGenPage({
            applicationSlug,
            pageSlug,
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
        onClick={() => goToGenPageForm({ applicationSlug, pageSlug, pageId })}
        subTitle={GENERATE_PAGE_ACTION_SUBTITLE()}
        title={GENERATE_PAGE_ACTION_TITLE()}
      />
    </>
  );
}

export default ActionCards;
