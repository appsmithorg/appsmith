import { FetchApplicationResponse } from "api/ApplicationApi";
import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";
import store from "store";

export const fetchPagesMockResponse = {
  responseMeta: {
    status: 200,
    success: true,
  },
  data: {
    workspaceId: "605c433c91dea93f0eaf91b5",
    pages: [
      {
        pageId: "605c435a91dea93f0eaf91ba",
        name: "Page1",
        isDefault: true,
        slug: "page-1",
      },
    ],
  },
};

export const fetchApplicationMockResponse: FetchApplicationResponse = {
  responseMeta: {
    status: 200,
    success: true,
  },
  data: {
    application: {
      id: "605c435a91dea93f0eaf91b8",
      name: "My Application",
      slug: "my-application",
      workspaceId: "",
      evaluationVersion: 1,
      appIsExample: false,
      gitApplicationMetadata: undefined,
      applicationVersion: 2,
    },
    pages: [
      {
        id: "605c435a91dea93f0eaf91ba",
        name: "Page1",
        isDefault: true,
        slug: "page-1",
      },
      {
        id: "605c435a91dea93f0eaf91bc",
        name: "Page2",
        isDefault: false,
        slug: "page-2",
      },
    ],
    workspaceId: "",
  },
};

export const setMockPageList = () => {
  store.dispatch({
    type: ReduxActionTypes.FETCH_PAGE_LIST_SUCCESS,
    payload: {
      applicationId: "605c435a91dea93f0eaf91b8",
      pages: fetchPagesMockResponse.data.pages,
    },
  });
};

export const setMockApplication = () => {
  store.dispatch({
    type: ReduxActionTypes.FETCH_APPLICATION_SUCCESS,
    payload: {
      ...fetchApplicationMockResponse.data.application,
      pages: fetchApplicationMockResponse.data.pages,
    },
  });
};

export const updatedApplicationPayload = {
  id: "605c435a91dea93f0eaf91b8",
  name: "Renamed application",
  slug: "renamed-application",
  workspaceId: "",
  evaluationVersion: 1,
  appIsExample: false,
  gitApplicationMetadata: undefined,
  applicationVersion: 2,
};

export const updatedPagePayload = {
  id: "605c435a91dea93f0eaf91bc",
  name: "My Page 2",
  isDefault: false,
  slug: "my-page-2",
};
