import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";
import store from "store";
import {
  fetchPagesMockResponse,
  fetchApplicationThreadsMockResponse,
} from "mockResponses/CommentApiMockResponse";
import urlBuilder from "entities/URLRedirect/URLAssembly";

const setMockPages = () => {
  const appId = fetchApplicationThreadsMockResponse.data[0].applicationId;
  store.dispatch({
    type: ReduxActionTypes.FETCH_APPLICATION_SUCCESS,
    payload: {
      id: appId,
      applicationVersion: 2,
      slug: "app-slug",
      pages: fetchPagesMockResponse.data.pages,
    },
  });
  store.dispatch({
    type: ReduxActionTypes.FETCH_PAGE_LIST_SUCCESS,
    payload: {
      pages: fetchPagesMockResponse.data.pages,
      applicationId: appId,
    },
  });
  store.dispatch({
    type: ReduxActionTypes.SWITCH_CURRENT_PAGE_ID,
    payload: {
      id: fetchPagesMockResponse.data.pages[0].id,
      slug: fetchPagesMockResponse.data.pages[0].slug,
    },
  });
};

export default setMockPages;
