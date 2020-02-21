import React, { useState, useEffect } from "react";
import { useHistory, useParams } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import {
  ReduxActionTypes,
  PageListPayload,
} from "constants/ReduxActionConstants";
import { AppState } from "reducers";
import { PAGE_LIST_EDITOR_URL } from "constants/routes";
import { ContextDropdownOption } from "components/editorComponents/ContextDropdown";
import PageListItem from "./PageListItem";
import CreatePageButton from "./CreatePageButton";

/** Page List */

const PageListSidebar = () => {
  /* Data from Reducers */
  const pages: PageListPayload = useSelector(
    (state: AppState) => state.entities.pageList.pages,
  );

  const defaultPageId = useSelector(
    (state: AppState) => state.entities.pageList.defaultPageId,
  );

  const applicationId = useSelector(
    (state: AppState) => state.entities.pageList.applicationId,
  );

  const isCreatingPage = useSelector(
    (state: AppState) => state.ui.editor.loadingStates.creatingPage,
  );

  /* Navigation */
  const { pageId } = useParams();
  const history = useHistory();
  const switchPage = (id: string): void => {
    if (id !== pageId) {
      history.push(PAGE_LIST_EDITOR_URL(applicationId, id));
    }
  };

  // Switch to new page if creation is a success.
  useEffect(() => {
    if (!isCreatingPage) {
      const latestPageId = pages.find(page => page.latest)?.pageId;
      if (latestPageId) {
        history.push(PAGE_LIST_EDITOR_URL(applicationId, latestPageId));
      }
    }
  }, [isCreatingPage, pages, applicationId, history]);

  /* Actions to dispatch */
  const dispatch = useDispatch();
  const createPage = (name: string): void => {
    if (name && name.trim().length > 0) {
      dispatch({
        type: ReduxActionTypes.CREATE_PAGE_INIT,
        payload: {
          applicationId,
          name,
        },
      });
    }
  };

  const updatePage = (id: string, name: string): void => {
    const currentName = pages.find(page => page.pageId === id)?.pageName;
    if (
      currentName !== undefined &&
      name &&
      name.length &&
      currentName.trim() !== name.trim()
    ) {
      dispatch({
        type: ReduxActionTypes.UPDATE_PAGE_INIT,
        payload: {
          id,
          name,
        },
      });
    }
  };

  const deletePage = (pageId: string): void => {
    dispatch({
      type: ReduxActionTypes.DELETE_PAGE_INIT,
      payload: {
        pageId,
      },
    });
  };

  const setPageAsDefault = (pageId: string, applicationId?: string): void => {
    dispatch({
      type: ReduxActionTypes.SET_DEFAULT_APPLICATION_PAGE_INIT,
      payload: {
        pageId,
        applicationId,
      },
    });
  };

  /* New page default name */
  const [nextPageName, setNextPageName] = useState(`Page${pages.length}`);
  useEffect(() => {
    setNextPageName(`Page${pages.length}`);
  }, [pages.length]);

  const renderPageList = (pages: PageListPayload) => {
    return pages.map(page => {
      const pageActions: ContextDropdownOption[] = [
        {
          value: "setdefault",
          onSelect: () => setPageAsDefault(page.pageId, applicationId),
          label: "Set as Home Page",
        },
        {
          value: "delete",
          onSelect: () => deletePage(page.pageId),
          intent: "danger",
          label: "Delete",
        },
      ];
      return (
        <PageListItem
          key={page.pageId}
          name={page.pageName}
          id={page.pageId}
          updatePage={updatePage}
          switchPage={switchPage}
          active={page.pageId === pageId}
          isDefault={defaultPageId === page.pageId}
          contextActions={pageActions}
        />
      );
    });
  };

  return (
    <React.Fragment>
      {renderPageList(pages)}
      <CreatePageButton
        onCreatePage={createPage}
        defaultValue={nextPageName}
        loading={isCreatingPage}
      />
    </React.Fragment>
  );
};

export default PageListSidebar;
