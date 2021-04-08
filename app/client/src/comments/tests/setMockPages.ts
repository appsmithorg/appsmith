import { ReduxActionTypes } from "constants/ReduxActionConstants";
import store from "store";
import {
  fetchPagesMockResponse,
  fetchApplicationThreadsMockResponse,
} from "mockResponses/CommentApiMockResponse";

const setMockPages = () => {
  const appId = fetchApplicationThreadsMockResponse.data[0].applicationId;
  store.dispatch({
    type: ReduxActionTypes.FETCH_PAGE_LIST_SUCCESS,
    payload: {
      pages: fetchPagesMockResponse.data.pages,
      applicationId: appId,
    },
  });
};

export default setMockPages;
