import Api from "api/Api";
import type { AxiosPromise } from "axios";
import type { ApiResponse } from "api/ApiResponses";

export interface BookmarkConfig {
  pageId: string;
  queryId: string;
  apiId: string;
  jsObjectId: string;
  lineNumber: string;
}

export interface Bookmark {
  entityType: string;
  entityId: string;
  lineNo: number;
  fieldName: string;
}

export interface BookmarksMap {
  bookmarks: Record<string, Bookmark[]>;
}

class BookmarksApi extends Api {
  static url = "v1/applications/${applicationId}";
  static fetchBookmarks(
    applicationId: string,
  ): AxiosPromise<ApiResponse<BookmarksMap>> {
    return Api.get(`v1/applications/${applicationId}/bookmark/get`);
  }

  static createBookmark(
    applicationId: string,
    bookmarks: BookmarksMap,
  ): Promise<any> {
    return Api.post(
      `v1/applications/${applicationId}/bookmark/update`,
      bookmarks,
    );
  }
}

export default BookmarksApi;
