import React, { useEffect } from "react";
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
} from "../../../../constants/messages";
import {
  BUILD_FROM_SCRATCH_ACTION_TITLE,
  BUILD_FROM_SCRATCH_ACTION_SUBTITLE,
} from "constants/messages";
import { useDispatch, useSelector } from "react-redux";
import { getCurrentPageId } from "selectors/editorSelectors";
import { fetchPage } from "actions/pageActions";

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
  const params = useParams<{ applicationId: string; pageId: string }>();
  const dispatch = useDispatch();

  const currentPageId = useSelector(getCurrentPageId);

  // Switch page
  useEffect(() => {
    if (currentPageId !== params.pageId && !!params.pageId) {
      dispatch(fetchPage(params.pageId));
    }
  }, [currentPageId, params.pageId, dispatch]);
  const { applicationId, pageId } = useParams<ExplorerURLParams>();

  return (
    <>
      <ActionCard
        Icon={FormIcons.CREATE_NEW_ICON}
        className="t--BuildFromScratch"
        onClick={() => routeToEmptyEditorFromGenPage({ applicationId, pageId })}
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
        onClick={() => goToGenPageForm({ applicationId, pageId })}
        subTitle={GENERATE_PAGE_ACTION_SUBTITLE()}
        title={GENERATE_PAGE_ACTION_TITLE()}
      />
    </>
  );
}

export default ActionCards;
