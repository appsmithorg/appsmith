import {
  createMessage,
  FETCHING_TEMPLATES,
  FORKING_TEMPLATE,
} from "@appsmith/constants/messages";
import {
  getSimilarTemplatesInit,
  getTemplateInformation,
  importTemplateIntoApplication,
} from "actions/templateActions";
import { Text, TextType } from "design-system";
import React, { useEffect, useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  getActiveTemplateSelector,
  isFetchingTemplateSelector,
  isImportingTemplateToAppSelector,
} from "selectors/templatesSelectors";
import styled from "styled-components";
import { IframeTopBar, IframeWrapper } from "../TemplateView";
import PageSelection from "./PageSelection";
import LoadingScreen from "./LoadingScreen";
import { Template } from "api/TemplatesApi";
import { generatePath, matchPath } from "react-router";
import { isURLDeprecated, trimQueryString } from "utils/helpers";
import { VIEWER_PATH, VIEWER_PATH_DEPRECATED } from "constants/routes";
import TemplateModalHeader from "./Header";
import TemplateDescription from "../Template/TemplateDescription";
import SimilarTemplates from "../Template/SimilarTemplates";
import { AppState } from "@appsmith/reducers";

const breakpointColumns = {
  default: 4,
  2100: 3,
  1600: 2,
  1100: 1,
};

const Wrapper = styled.div`
  height: 85vh;
  display: flex;
  flex-direction: column;
`;

const Body = styled.div`
  padding: 0 ${(props) => props.theme.spaces[11]}px;
  padding-top: ${(props) => props.theme.spaces[7]}px;
  height: 80vh;
  overflow: auto;
  &&::-webkit-scrollbar-thumb {
    background-color: ${(props) => props.theme.colors.modal.scrollbar};
  }
  &::-webkit-scrollbar {
    width: 4px;
  }
`;

const StyledSimilarTemplatesWrapper = styled(SimilarTemplates)`
  padding: 0px;
`;

const TemplateDescriptionWrapper = styled.div`
  padding-bottom: 52px;
`;

type TemplateDetailedViewProps = {
  templateId: string;
  onBackPress: () => void;
  onClose: () => void;
};

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

  const onForkTemplateClick = (template: Template) => {
    dispatch(importTemplateIntoApplication(template.id, template.title));
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
      <TemplateModalHeader
        onBackPress={props.onBackPress}
        onClose={props.onClose}
      />
      <Body className="flex flex-row">
        <div className="flex flex-col flex-1">
          <Text type={TextType.DANGER_HEADING}>{currentTemplate.title}</Text>
          <IframeWrapper>
            <IframeTopBar>
              <div className="round red" />
              <div className="round yellow" />
              <div className="round green" />
            </IframeTopBar>
            <iframe src={`${previewUrl}?embed=true`} />
          </IframeWrapper>
          <TemplateDescriptionWrapper>
            <TemplateDescription hideForkButton template={currentTemplate} />
          </TemplateDescriptionWrapper>
          <StyledSimilarTemplatesWrapper
            breakpointCols={breakpointColumns}
            onBackPress={props.onBackPress}
            onClick={onSimilarTemplateClick}
            onFork={onForkTemplateClick}
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
