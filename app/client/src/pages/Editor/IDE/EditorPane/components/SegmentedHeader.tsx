import React, { useCallback, useEffect, useState } from "react";
import {
  AnnouncementPopover,
  AnnouncementPopoverContent,
  AnnouncementPopoverTrigger,
  Button,
  Flex,
  SegmentedControl,
  Tag,
} from "design-system";
import { createMessage, EDITOR_PANE_TEXTS } from "@appsmith/constants/messages";
import { EditorEntityTab } from "@appsmith/entities/IDE/constants";
import history from "utils/history";
import {
  globalAddURL,
  jsCollectionListURL,
  queryListURL,
  widgetListURL,
} from "@appsmith/RouteBuilder";
import { useSelector } from "react-redux";
import { useCurrentEditorState, useSegmentNavigation } from "../../hooks";
import styled from "styled-components";
import { useFeatureFlag } from "utils/hooks/useFeatureFlag";
import { FEATURE_FLAG } from "@appsmith/entities/FeatureFlag";
import { getCurrentBasePageId } from "selectors/editorSelectors";
import { LOCAL_STORAGE_KEYS } from "utils/localStorage";
import clsx from "clsx";

const Container = styled(Flex)`
  #editor-pane-segment-control {
    max-width: 247px;

    &.overlay-active > [data-selected="true"] {
      outline: 2px solid #8bb0fa;
      box-shadow: 0 0 0 0 #8bb0fa;
    }
  }

  button {
    flex-shrink: 0;
    flex-basis: auto;
  }
`;

const Dot = styled.div`
  width: 8px;
  height: 8px;
  flex-grow: 0;
  transform: rotate(-90deg);
  border-radius: 4px;
  box-shadow: inset 0 1px 2px 0 rgba(76, 86, 100, 0.08);
  background-color: #e3e8ef;
  position: relative;

  &.active::after {
    content: "";
    position: absolute;
    top: 1px;
    right: 1px;
    width: 6px;
    height: 6px;
    background-color: #fff;
    border-radius: 4px;
  }
`;

const TutorialDots = ({ active }: { active: number }) => (
  <Flex gap="spaces-2">
    <Dot className={clsx({ active: active === 1 })} />
    <Dot className={clsx({ active: active === 2 })} />
    <Dot className={clsx({ active: active === 3 })} />
  </Flex>
);

const LabelWithTutorial = ({
  label,
  type,
}: {
  label: string;
  type: EditorEntityTab;
}) => {
  const basePageId = useSelector(getCurrentBasePageId);
  const [open, setOpen] = useState(true);
  const overlayEle = document.getElementById("editor-pane-segment-control");

  const removeOverlay = useCallback(() => {
    if (overlayEle) {
      overlayEle.classList.remove("overlay-active");
    }
  }, [overlayEle]);

  useEffect(() => {
    if (open) {
      overlayEle?.classList.add("overlay-active");
    } else {
      removeOverlay();
    }
  }, [open, overlayEle, removeOverlay]);

  const nextClickHandler = (_type: EditorEntityTab, backward = false) => {
    switch (_type) {
      case EditorEntityTab.QUERIES:
        setTimeout(() => history.push(jsCollectionListURL({ basePageId })), 0);
        localStorage.setItem(LOCAL_STORAGE_KEYS.SEGMENT_INTRO_MODAL, "2");
        break;
      case EditorEntityTab.JS:
        if (backward) {
          setTimeout(() => history.push(queryListURL({ basePageId })), 0);
          localStorage.setItem(LOCAL_STORAGE_KEYS.SEGMENT_INTRO_MODAL, "1");
        } else {
          setTimeout(() => history.push(widgetListURL({ basePageId })), 0);
          localStorage.setItem(LOCAL_STORAGE_KEYS.SEGMENT_INTRO_MODAL, "3");
        }
        break;
      case EditorEntityTab.UI:
        if (backward) {
          setTimeout(
            () => history.push(jsCollectionListURL({ basePageId })),
            0,
          );
          localStorage.setItem(LOCAL_STORAGE_KEYS.SEGMENT_INTRO_MODAL, "2");
        } else {
          removeOverlay();
          setOpen(false);
          localStorage.setItem(LOCAL_STORAGE_KEYS.SEGMENT_INTRO_MODAL, "4");
        }
        break;
    }
  };

  const announcementMap = {
    [EditorEntityTab.QUERIES]: {
      title: "Access data with Queries",
      description: (
        <div>
          Creating Queries will allow you to show data from your datasources in
          your UI (elements) with bindings such as{" "}
          <Tag className="!inline-flex" isClosable={false} kind="premium">
            {"{{QueryName.data}}"}
          </Tag>
        </div>
      ),
      footer: (
        <Flex flexDirection={"column"} gap="spaces-7">
          <Flex gap="spaces-2" justifyContent={"flex-end"} width="100%">
            <Button
              kind="primary"
              onClick={() => nextClickHandler(EditorEntityTab.QUERIES)}
              size="md"
            >
              Next
            </Button>
          </Flex>
          <TutorialDots active={1} />
        </Flex>
      ),
    },
    [EditorEntityTab.JS]: {
      title: "Write complex business logic with JSObjects",
      description: (
        <div>
          Write business logic, perform complex data manipulations, and interact
          seamlessly with Appsmith&apos;s UI (elements) and Queries.
        </div>
      ),
      footer: (
        <Flex flexDirection={"column"} gap="spaces-7">
          <Flex gap="spaces-2" justifyContent={"flex-end"} width="100%">
            <Button
              kind="tertiary"
              onClick={() => nextClickHandler(EditorEntityTab.JS, true)}
              size="md"
            >
              Back
            </Button>
            <Button
              kind="primary"
              onClick={() => nextClickHandler(EditorEntityTab.JS)}
              size="md"
            >
              Next
            </Button>
          </Flex>
          <TutorialDots active={2} />
        </Flex>
      ),
    },
    [EditorEntityTab.UI]: {
      title: "Create UI with over 50 of Appsmith’s UI elements",
      description: (
        <div>
          Drag & drop elements and connect them with Queries or JSObjects with
          bindings such as{" "}
          <Tag className="!inline-flex" isClosable={false} kind="premium">
            {"{{QueryName.data}}"}
          </Tag>
        </div>
      ),
      footer: (
        <Flex flexDirection={"column"} gap="spaces-7">
          <Flex gap="spaces-2" justifyContent={"flex-end"} width="100%">
            <Button
              kind="tertiary"
              onClick={() => nextClickHandler(EditorEntityTab.UI, true)}
              size="md"
            >
              Back
            </Button>
            <Button
              kind="primary"
              onClick={() => nextClickHandler(EditorEntityTab.UI)}
              size="md"
            >
              Finish
            </Button>
          </Flex>
          <TutorialDots active={3} />
        </Flex>
      ),
    },
  };
  return (
    <AnnouncementPopover open={open}>
      <AnnouncementPopoverTrigger>
        <a className="!no-underline hover:text-inherit p-[4px]">{label}</a>
      </AnnouncementPopoverTrigger>
      <AnnouncementPopoverContent
        collisionPadding={8}
        description={announcementMap[type].description}
        footer={announcementMap[type].footer}
        side="bottom"
        title={announcementMap[type].title}
      />
    </AnnouncementPopover>
  );
};

const SegmentedHeader = () => {
  const isGlobalAddPaneEnabled = useFeatureFlag(
    FEATURE_FLAG.release_global_add_pane_enabled,
  );
  const basePageId = useSelector(getCurrentBasePageId);
  const onAddButtonClick = () => {
    history.push(globalAddURL({ basePageId }));
  };
  const { segment } = useCurrentEditorState();
  const { onSegmentChange } = useSegmentNavigation();
  const localStorageFlag =
    localStorage.getItem(LOCAL_STORAGE_KEYS.SEGMENT_INTRO_MODAL) || "0";

  return (
    <Container
      alignItems="center"
      backgroundColor="var(--ads-v2-colors-control-track-default-bg)"
      className="ide-editor-left-pane__header"
      gap="spaces-2"
      justifyContent="space-between"
      padding="spaces-2"
    >
      <SegmentedControl
        id="editor-pane-segment-control"
        onChange={onSegmentChange}
        options={[
          {
            label:
              localStorageFlag === "1" ? (
                <LabelWithTutorial
                  label={createMessage(EDITOR_PANE_TEXTS.queries_tab)}
                  type={EditorEntityTab.QUERIES}
                />
              ) : (
                createMessage(EDITOR_PANE_TEXTS.queries_tab)
              ),
            value: EditorEntityTab.QUERIES,
          },
          {
            label:
              localStorageFlag === "2" ? (
                <LabelWithTutorial
                  label={createMessage(EDITOR_PANE_TEXTS.js_tab)}
                  type={EditorEntityTab.JS}
                />
              ) : (
                createMessage(EDITOR_PANE_TEXTS.js_tab)
              ),
            value: EditorEntityTab.JS,
          },
          {
            label:
              localStorageFlag === "3" ? (
                <LabelWithTutorial
                  label={createMessage(EDITOR_PANE_TEXTS.ui_tab)}
                  type={EditorEntityTab.UI}
                />
              ) : (
                createMessage(EDITOR_PANE_TEXTS.ui_tab)
              ),
            value: EditorEntityTab.UI,
          },
        ]}
        value={segment}
      />
      {isGlobalAddPaneEnabled ? (
        <Button
          className={"t--add-editor-button"}
          isIconButton
          kind="primary"
          onClick={onAddButtonClick}
          size="sm"
          startIcon="add-line"
        />
      ) : null}
    </Container>
  );
};

export default SegmentedHeader;
