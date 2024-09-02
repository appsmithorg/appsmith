import type { ApplicationResponsePayload } from "ee/api/ApplicationApi";
import type { Page } from "entities/Page";
import { ReduxActionTypes } from "ee/constants/ReduxActionConstants";
import type { UpdateCurrentPagePayload } from "actions/pageActions";
import store from "store";

const workspaceId = "";
const applicationId = "605c435a91dea93f0eaf91b8";
const baseApplicationId = "605c435a91dea93f0eaf91b8";
const page1Id = "605c435a91dea93f0eaf91ba";
const basePage1Id = "605c435a91dea93f0eaf91ba";
const page2Id = "605c435a91dea93f0eaf91bc";
const basePage2Id = "605c435a91dea93f0eaf91bc";

export const mockApplicationPayload: ApplicationResponsePayload = {
  id: applicationId,
  baseId: baseApplicationId,
  name: "My Application",
  slug: "my-application",
  workspaceId,
  evaluationVersion: 1,
  appIsExample: false,
  gitApplicationMetadata: undefined,
  applicationVersion: 2,
  pages: [
    {
      id: page1Id,
      baseId: basePage1Id,
      name: "Page1",
      isDefault: true,
      slug: "page-1",
    },
    {
      id: page2Id,
      baseId: basePage2Id,
      name: "Page2",
      isDefault: false,
      slug: "page-2",
    },
  ],
};

export const mockPageListPayload: {
  pages: Page[];
  applicationId: string;
  baseApplicationId: string;
} = {
  applicationId: applicationId,
  baseApplicationId: baseApplicationId,
  pages: [
    {
      pageId: page1Id,
      basePageId: page2Id,
      pageName: "Page1",
      isDefault: true,
      slug: "page-1",
    },
    {
      pageId: page2Id,
      basePageId: basePage2Id,
      pageName: "Page2",
      isDefault: false,
      slug: "page-2",
    },
  ],
};

const mockUpdateCurrentPagePayload: UpdateCurrentPagePayload = {
  id: mockApplicationPayload.pages[0].id,
  slug: mockApplicationPayload.pages[0].slug,
};

export const setMockPageList = () => {
  store.dispatch({
    type: ReduxActionTypes.FETCH_PAGE_LIST_SUCCESS,
    payload: mockPageListPayload,
  });
};

export const setMockApplication = () => {
  store.dispatch({
    type: ReduxActionTypes.FETCH_APPLICATION_SUCCESS,
    payload: mockApplicationPayload,
  });
};

export const updateMockCurrentPage = () => {
  store.dispatch({
    type: ReduxActionTypes.SWITCH_CURRENT_PAGE_ID,
    payload: mockUpdateCurrentPagePayload,
  });
};

export const updatedApplicationPayload = {
  id: applicationId,
  baseId: baseApplicationId,
  name: "Renamed application",
  slug: "renamed-application",
  workspaceId: "",
  evaluationVersion: 1,
  appIsExample: false,
  gitApplicationMetadata: undefined,
  applicationVersion: 2,
};

export const updatedPagePayload = {
  id: page2Id,
  baseId: basePage2Id,
  name: "My Page 2",
  isDefault: false,
  slug: "my-page-2",
};
