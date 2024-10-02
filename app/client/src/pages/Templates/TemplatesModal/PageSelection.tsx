import type { ApplicationPagePayload } from "ee/api/ApplicationApi";
import {
  FILTER_SELECTALL,
  FILTER_SELECT_PAGE,
  FILTER_SELECT_PAGES,
  PAGE,
  PAGES,
  createMessage,
} from "ee/constants/messages";
import { getCurrentAppWorkspace } from "ee/selectors/selectedWorkspaceSelectors";
import { importTemplateIntoApplication } from "actions/templateActions";
import type { Template } from "api/TemplatesApi";
import { Button, Checkbox, Divider, Icon, Text } from "@appsmith/ads";
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getCurrentApplicationId } from "selectors/editorSelectors";
import styled from "styled-components";
import AnalyticsUtil from "ee/utils/AnalyticsUtil";

const Wrapper = styled.div`
  width: 280px;
  padding-left: ${(props) => props.theme.spaces[9]}px;
  position: sticky;
  top: 0;
  height: fit-content;
`;

const Card = styled.div`
  padding: ${(props) => props.theme.spaces[9]}px;
  border: solid 1px var(--ads-v2-color-border);
  border-radius: var(--ads-v2-border-radius);
`;

const CardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const Page = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 12px;
  margin-bottom: 20px;
  .ads-v2-checkbox {
    height: 16px;
    width: 16px;
    padding: 0;
  }
`;
const PageName = styled.div`
  cursor: pointer;
  &:hover {
    text-decoration: underline;
    text-underline-offset: 2px;
  }
  .cs-text {
    margin-left: 4px;
  }
`;
const StyledButton = styled(Button)`
  margin-top: 12px;
`;

interface PageSelectionProps {
  isStartWithTemplateFlow: boolean;
  pages: ApplicationPagePayload[];
  template: Template;
  onPageSelection: (pageId: string) => void;
}

function PageSelection(props: PageSelectionProps) {
  const dispatch = useDispatch();
  const [selectedPages, setSelectedPages] = useState(
    props.pages.map((page) => page.name),
  );
  const pagesText =
    props.pages.length > 1 || props.pages.length === 0
      ? createMessage(PAGES)
      : createMessage(PAGE);
  const applicationId = useSelector(getCurrentApplicationId);
  const currentWorkSpace = useSelector(getCurrentAppWorkspace);

  useEffect(() => {
    setSelectedPages(props.pages.map((page) => page.name));
  }, [props.pages]);

  const onSelection = (selectedPageName: string, checked: boolean) => {
    if (checked) {
      if (!selectedPages.includes(selectedPageName)) {
        setSelectedPages((pages) => [...pages, selectedPageName]);
      }
    } else {
      setSelectedPages((pages) =>
        pages.filter((pageName) => pageName !== selectedPageName),
      );
    }
  };

  const onSelectAllToggle = (checked: boolean) => {
    if (checked) {
      setSelectedPages(props.pages.map((page) => page.name));
    } else {
      setSelectedPages([]);
    }
  };

  const importPagesToApp = () => {
    dispatch(
      importTemplateIntoApplication(
        props.template.id,
        props.template.title,
        selectedPages,
      ),
    );

    if (props.isStartWithTemplateFlow) {
      AnalyticsUtil.logEvent("fork_APPLICATIONTEMPLATE", {
        applicationId: applicationId,
        workspaceId: currentWorkSpace.id,
        source: "canvas",
        eventData: {
          templateAppName: props.template.title,
          selectedPages,
        },
      });
    }
  };

  return (
    <Wrapper>
      <Card>
        <CardHeader>
          <Text kind="heading-s">
            {props.pages.length} {pagesText}
          </Text>
          <div className="flex">
            {/* <Text type={TextType.P4}>{createMessage(FILTER_SELECTALL)}</Text> */}
            <Checkbox
              isDisabled={props.pages.length === 0}
              isSelected={selectedPages.length === props.pages.length}
              onChange={onSelectAllToggle}
            >
              {createMessage(FILTER_SELECTALL)}
            </Checkbox>
          </div>
        </CardHeader>
        <Divider />
        {props.pages.map((page) => {
          return (
            <Page key={page.id}>
              <PageName
                className="flex items-center"
                onClick={() => props.onPageSelection(page.id)}
              >
                <Icon name="page-line" size="md" />
                <Text className="cs-text" kind="body-m">
                  {page.name}
                </Text>
              </PageName>
              <Checkbox
                isSelected={selectedPages.includes(page.name)}
                onChange={(checked) => onSelection(page.name, checked)}
              />
            </Page>
          );
        })}
        <StyledButton
          data-testid="template-fork-button"
          isDisabled={!selectedPages.length}
          onClick={importPagesToApp}
          size="md"
        >
          {createMessage(
            props.pages.length === 1 ? FILTER_SELECT_PAGE : FILTER_SELECT_PAGES,
          )}
        </StyledButton>
      </Card>
    </Wrapper>
  );
}

export default PageSelection;
