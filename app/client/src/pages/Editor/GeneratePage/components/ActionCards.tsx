import React from "react";
import ActionCard from "./ActionCard";
import { FormIcons } from "icons/FormIcons";
import history from "utils/history";
import { BUILDER_PAGE_URL, getGenerateTemplateFormURL } from "constants/routes";
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
import { getCurrentApplicationId } from "selectors/editorSelectors";

type routeId = {
  applicationId: string;
  pageId: string;
};

const routeToEmptyEditorFromGenPage = ({
  applicationId,
  pageId,
}: routeId): void => {
  AnalyticsUtil.logEvent("BUILD_FROM_SCRATCH_ACTION_CARD_CLICK");
  history.push(BUILDER_PAGE_URL({ applicationId: applicationId, pageId }));
};

const goToGenPageForm = ({ applicationId, pageId }: routeId): void => {
  AnalyticsUtil.logEvent("GEN_CRUD_PAGE_ACTION_CARD_CLICK");
  history.push(getGenerateTemplateFormURL(applicationId, pageId));
};

function ActionCards() {
  const { pageId } = useParams<ExplorerURLParams>();
  const applicationId = useSelector(getCurrentApplicationId);

  return (
    <>
      <ActionCard
        Icon={FormIcons.CREATE_NEW_ICON}
        className="t--BuildFromScratch"
        onClick={() =>
          routeToEmptyEditorFromGenPage({
            applicationId: applicationId,
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
        onClick={() =>
          goToGenPageForm({ applicationId: applicationId, pageId })
        }
        subTitle={GENERATE_PAGE_ACTION_SUBTITLE()}
        title={GENERATE_PAGE_ACTION_TITLE()}
      />
    </>
  );
}

export default ActionCards;
