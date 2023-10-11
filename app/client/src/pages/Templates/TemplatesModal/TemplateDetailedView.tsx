import {
  createMessage,
  FETCHING_TEMPLATES,
  FORKING_TEMPLATE,
  TEMPLATES_BACK_BUTTON,
} from "@appsmith/constants/messages";
import type { AppState } from "@appsmith/reducers";
import {
  getSimilarTemplatesInit,
  getTemplateInformation,
} from "actions/templateActions";
import type { Template } from "api/TemplatesApi";
import { VIEWER_PATH, VIEWER_PATH_DEPRECATED } from "constants/routes";
import { Text } from "design-system-old";
import React, { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { generatePath, matchPath } from "react-router";
import {
  getActiveTemplateSelector,
  isFetchingTemplateSelector,
  isImportingTemplateToAppSelector,
} from "selectors/templatesSelectors";
import styled from "styled-components";
import { isURLDeprecated, trimQueryString } from "utils/helpers";
import SimilarTemplates from "../Template/SimilarTemplates";
import TemplateDescription from "../Template/TemplateDescription";
import { IframeTopBar, IframeWrapper } from "../TemplateView";
import LoadingScreen from "./LoadingScreen";
import PageSelection from "./PageSelection";
import { Link } from "design-system";

const breakpointColumns = {
  default: 4,
  3000: 3,
  1500: 3,
  1024: 2,
  800: 1,
};

const Wrapper = styled.div`
  height: 85vh;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  .back-button {
    margin-right: 8px;
  }
`;

const Body = styled.div`
  margin-bottom: ${(props) => props.theme.spaces[7]}px;
  height: 70vh;
  overflow: auto;
`;

const StyledSimilarTemplatesWrapper = styled(SimilarTemplates)`
  padding: 0px;
`;

const TemplateDescriptionWrapper = styled.div`
  padding-bottom: 52px;
`;

interface TemplateDetailedViewProps {
  templateId: string;
  onBackPress: () => void;
  onClose: () => void;
}

function TemplateDetailedView(props: TemplateDetailedViewProps) {
  const [currentTemplateId, setCurrentTemplateId] = useState(props.templateId);
  const [previewUrl, setPreviewUrl] = useState("");
  const dispatch = useDispatch();
  const similarTemplates = useSelector(
    (state: AppState) => state.ui.templates.similarTemplates,
  );
  const isFetchingTemplate = useSelector(isFetchingTemplateSelector);
  const isImportingTemplateToApp = useSelector(
    isImportingTemplateToAppSelector,
  );
  const currentTemplate = useSelector(getActiveTemplateSelector);
  const containerRef = useRef<HTMLDivElement>(null);
  const LoadingText = isImportingTemplateToApp
    ? createMessage(FORKING_TEMPLATE)
    : createMessage(FETCHING_TEMPLATES);

  useEffect(() => {
    dispatch(getTemplateInformation(currentTemplateId));
    dispatch(getSimilarTemplatesInit(currentTemplateId));
  }, [currentTemplateId]);

  useEffect(() => {
    if (currentTemplate?.appUrl) {
      setPreviewUrl(currentTemplate.appUrl);
    }
  }, [currentTemplate?.id]);

  const onSimilarTemplateClick = (template: Template) => {
    setCurrentTemplateId(template.id);
    if (containerRef.current) {
      containerRef.current.scrollTo({ top: 0 });
    }
  };

  if (isFetchingTemplate || isImportingTemplateToApp) {
    return <LoadingScreen text={LoadingText} />;
  }

  if (!currentTemplate) {
    return null;
  }

  // Update the page id in the url
  const onPageSelection = (pageId: string) => {
    const url = new URL(currentTemplate.appUrl);
    const path = isURLDeprecated(url.pathname)
      ? VIEWER_PATH_DEPRECATED
      : VIEWER_PATH;
    const matchViewerPath = matchPath(url.pathname, {
      path: [trimQueryString(path)],
    });
    url.pathname = generatePath(path, {
      ...matchViewerPath?.params,
      pageId,
    });
    setPreviewUrl(url.toString());
  };

  return (
    <Wrapper ref={containerRef}>
      <Body className="flex flex-row templates-body">
        <div className="flex flex-col flex-1">
          <div className="flex flex-row items-center ">
            <Link
              className="back-button"
              kind="secondary"
              onClick={props.onBackPress}
              startIcon="back-control"
            >
              {createMessage(TEMPLATES_BACK_BUTTON)}
            </Link>
            <Text type={"dangerHeading"}>{currentTemplate.title}</Text>
          </div>
          <IframeWrapper>
            <IframeTopBar>
              <div className="round red" />
              <div className="round yellow" />
              <div className="round green" />
            </IframeTopBar>
            <iframe src={previewUrl} />
          </IframeWrapper>
          <TemplateDescriptionWrapper>
            <TemplateDescription template={currentTemplate} />
          </TemplateDescriptionWrapper>
          <StyledSimilarTemplatesWrapper
            breakpointCols={breakpointColumns}
            isForkingEnabled={false}
            onBackPress={props.onBackPress}
            onClick={onSimilarTemplateClick}
            onFork={onSimilarTemplateClick}
            similarTemplates={similarTemplates}
          />
        </div>
        <PageSelection
          onPageSelection={onPageSelection}
          pages={currentTemplate.pages || []}
          template={currentTemplate}
        />
      </Body>
    </Wrapper>
  );
}

export default TemplateDetailedView;
