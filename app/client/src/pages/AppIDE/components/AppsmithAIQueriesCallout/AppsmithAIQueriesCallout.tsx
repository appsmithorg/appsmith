import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import styled from "styled-components";
import { useDispatch, useSelector } from "react-redux";
import {
  Button,
  Callout,
  type CalloutLinkProps,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Text,
} from "@appsmith/ads";
import { deleteHiddenPluginActions } from "actions/pluginActionActions";
import { DocsLink, openDoc } from "constants/DocumentationLinks";
import {
  APPSMITH_AI_DEPRECATION_LEARN_MORE,
  APPSMITH_AI_QUERIES_BANNER_MESSAGE,
  APPSMITH_AI_QUERIES_BANNER_NO_PERMISSION,
  APPSMITH_AI_QUERIES_DELETE,
  APPSMITH_AI_QUERIES_DELETE_CANCEL,
  APPSMITH_AI_QUERIES_DELETE_CONFIRM,
  APPSMITH_AI_QUERIES_DELETE_DATASOURCES,
  APPSMITH_AI_QUERIES_DELETE_DESCRIPTION,
  APPSMITH_AI_QUERIES_DELETE_LIST_LABEL,
  APPSMITH_AI_QUERIES_DELETE_PARTIAL,
  APPSMITH_AI_QUERIES_DELETE_TITLE,
  createMessage,
} from "ee/constants/messages";
import { FEATURE_FLAG } from "ee/entities/FeatureFlag";
import { getHiddenPluginActions } from "ee/selectors/entitiesSelector";
import { getHasDeleteActionPermission } from "ee/utils/BusinessFeatures/permissionPageHelpers";
import { isStoredDatasource } from "entities/Action";
import { getPageList } from "selectors/editorSelectors";
import { selectCombinedPreviewMode } from "selectors/gitModSelectors";
import { useFeatureFlag } from "utils/hooks/useFeatureFlag";

const QueryNameList = styled.ul`
  max-height: 200px;
  overflow-y: auto;
  margin: var(--ads-v2-spaces-4) 0;
  padding-left: var(--ads-v2-spaces-7);
  list-style: disc;
`;

const ModalParagraph = styled(Text)`
  display: block;
  margin-top: var(--ads-v2-spaces-3);
`;

/**
 * True when the editor should show the Appsmith AI queries banner: the app
 * still has queries of a hidden plugin (see isHiddenPlugin), and the editor is
 * not in preview mode or on a protected git branch (selectCombinedPreviewMode
 * covers both). Deployed apps never render the editor layout, so app viewers
 * never see the banner.
 */
export function useShowAppsmithAIQueriesCallout() {
  const hiddenActions = useSelector(getHiddenPluginActions);
  const isPreviewMode = useSelector(selectCombinedPreviewMode);

  return hiddenActions.length > 0 && !isPreviewMode;
}

interface AppsmithAIQueriesCalloutProps {
  // Called with the banner's rendered height in px (0 when it unmounts), so
  // the layout can size the editor below it. The message can wrap, so the
  // height is measured rather than fixed.
  onHeightChange?: (height: number) => void;
}

/**
 * Editor banner for apps that still have Appsmith AI queries. The editor
 * lists hide those queries, so this is where developers find and delete them.
 */
export function AppsmithAIQueriesCallout({
  onHeightChange,
}: AppsmithAIQueriesCalloutProps) {
  const dispatch = useDispatch();
  const hiddenActions = useSelector(getHiddenPluginActions);
  const pages = useSelector(getPageList);
  const isGacEnabled = useFeatureFlag(FEATURE_FLAG.license_gac_enabled);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const isMountedRef = useRef(true);

  useEffect(function trackMounted() {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useLayoutEffect(
    function reportHeight() {
      const element = rootRef.current;

      if (!element || !onHeightChange) return;

      onHeightChange(element.offsetHeight);

      // Older test environments have no ResizeObserver; the first measure
      // above still applies there.
      if (typeof ResizeObserver === "undefined") {
        return () => onHeightChange(0);
      }

      const observer = new ResizeObserver(() =>
        onHeightChange(element.offsetHeight),
      );

      observer.observe(element);

      return () => {
        observer.disconnect();
        onHeightChange(0);
      };
    },
    [onHeightChange],
  );

  // Only queries this user may delete are deleted.
  const deletableActions = useMemo(
    () =>
      hiddenActions.filter((action) =>
        getHasDeleteActionPermission(
          isGacEnabled,
          action.config.userPermissions,
        ),
      ),
    [hiddenActions, isGacEnabled],
  );

  // Query names are unique per page only, so the list shows the page too.
  const pageNameById = useMemo(
    () => Object.fromEntries((pages || []).map((p) => [p.pageId, p.pageName])),
    [pages],
  );

  const openModal = useCallback(() => setIsModalOpen(true), []);
  const closeModal = useCallback(() => {
    if (!isDeleting) setIsModalOpen(false);
  }, [isDeleting]);

  const handleDelete = useCallback(() => {
    const datasourceIds = new Set<string>();

    deletableActions.forEach((action) => {
      const datasource = action.config.datasource;

      // Embedded datasources have no id and belong to the query itself.
      if (isStoredDatasource(datasource) && datasource.id) {
        datasourceIds.add(datasource.id);
      }
    });

    setIsDeleting(true);
    dispatch(
      deleteHiddenPluginActions({
        actions: deletableActions.map((action) => ({
          id: action.config.id,
          name: action.config.name,
        })),
        datasourceIds: [...datasourceIds],
        onComplete: () => {
          // The banner unmounts once no Appsmith AI query is left, which can
          // happen before the saga finishes.
          if (!isMountedRef.current) return;

          setIsDeleting(false);
          setIsModalOpen(false);
        },
      }),
    );
  }, [deletableActions, dispatch]);

  if (hiddenActions.length === 0) return null;

  const total = hiddenActions.length;
  const deletable = deletableActions.length;

  const links: Array<
    CalloutLinkProps & { key: string; "data-testid": string }
  > = [];

  if (deletable > 0) {
    links.push({
      key: "delete",
      "data-testid": "t--appsmith-ai-queries-delete-cta",
      children: createMessage(APPSMITH_AI_QUERIES_DELETE, deletable),
      onClick: openModal,
    });
  }

  links.push({
    key: "learn-more",
    "data-testid": "t--appsmith-ai-queries-learn-cta",
    children: createMessage(APPSMITH_AI_DEPRECATION_LEARN_MORE),
    onClick: () => openDoc(DocsLink.APPSMITH_AI_DEPRECATION),
  });

  return (
    <div data-testid="t--appsmith-ai-queries-callout" ref={rootRef}>
      <Callout kind="warning" links={links}>
        {createMessage(APPSMITH_AI_QUERIES_BANNER_MESSAGE, total)}
        {deletable === 0 &&
          ` ${createMessage(APPSMITH_AI_QUERIES_BANNER_NO_PERMISSION, total)}`}
      </Callout>
      <Modal
        onOpenChange={(open) => {
          if (!open) closeModal();
        }}
        open={isModalOpen}
      >
        <ModalContent
          data-testid="t--appsmith-ai-queries-delete-modal"
          onInteractOutside={(e) => e.preventDefault()}
          style={{ width: "640px" }}
        >
          <ModalHeader>
            {createMessage(APPSMITH_AI_QUERIES_DELETE_TITLE, deletable)}
          </ModalHeader>
          <ModalBody>
            <Text kind="action-l">
              {createMessage(APPSMITH_AI_QUERIES_DELETE_DESCRIPTION, deletable)}
            </Text>
            {deletable < total && (
              <ModalParagraph kind="action-l">
                {createMessage(
                  APPSMITH_AI_QUERIES_DELETE_PARTIAL,
                  deletable,
                  total,
                )}
              </ModalParagraph>
            )}
            <QueryNameList
              aria-label={createMessage(APPSMITH_AI_QUERIES_DELETE_LIST_LABEL)}
              tabIndex={0}
            >
              {deletableActions.map((action) => (
                <li key={action.config.id}>
                  <Text kind="action-m">
                    {action.config.name}
                    {pageNameById[action.config.pageId]
                      ? ` · ${pageNameById[action.config.pageId]}`
                      : ""}
                  </Text>
                </li>
              ))}
            </QueryNameList>
            <Text kind="action-m">
              {createMessage(APPSMITH_AI_QUERIES_DELETE_DATASOURCES)}
            </Text>
          </ModalBody>
          <ModalFooter>
            <div className="flex gap-3">
              <Button
                isDisabled={isDeleting}
                kind="secondary"
                onClick={closeModal}
                size="md"
              >
                {createMessage(APPSMITH_AI_QUERIES_DELETE_CANCEL)}
              </Button>
              <Button
                data-testid="t--appsmith-ai-queries-delete-confirm"
                isLoading={isDeleting}
                kind="error"
                onClick={handleDelete}
                size="md"
              >
                {createMessage(APPSMITH_AI_QUERIES_DELETE_CONFIRM)}
              </Button>
            </div>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
