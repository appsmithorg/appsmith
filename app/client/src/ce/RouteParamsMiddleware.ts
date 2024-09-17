import type { ApplicationPayload } from "entities/Application";
import type { Page } from "entities/Page";
import type { ReduxAction } from "ee/constants/ReduxActionConstants";
import { ReduxActionTypes } from "ee/constants/ReduxActionConstants";
import type { UpdatePageResponse } from "api/PageApi";
import type {
  ApplicationURLParams,
  PageURLParams,
} from "ee/entities/URLRedirect/URLAssembly";
import urlBuilder from "ee/entities/URLRedirect/URLAssembly";
import type { Middleware } from "redux";

// TODO: Fix this the next time the file is edited
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const handler = (action: ReduxAction<any>) => {
  let appParams: ApplicationURLParams = {};
  let pageParams: PageURLParams[] = [];
  switch (action?.type) {
    case ReduxActionTypes.IMPORT_APPLICATION_SUCCESS:
    case ReduxActionTypes.IMPORT_TEMPLATE_TO_WORKSPACE_SUCCESS:
    case ReduxActionTypes.FETCH_APPLICATION_SUCCESS: {
      const application: ApplicationPayload = action.payload;
      const { pages } = application;
      appParams = {
        baseApplicationId: application.baseId,
        applicationSlug: application.slug,
        applicationVersion: application.applicationVersion,
      };
      pageParams = pages.map((page) => ({
        pageSlug: page.slug,
        basePageId: page.baseId,
        customSlug: page.customSlug,
      }));
      break;
    }
    case ReduxActionTypes.FORK_APPLICATION_SUCCESS:
    case ReduxActionTypes.CREATE_APPLICATION_SUCCESS: {
      const application: ApplicationPayload = action.payload.application;
      const { pages } = application;
      appParams = {
        baseApplicationId: application.baseId,
        applicationSlug: application.slug,
        applicationVersion: application.applicationVersion,
      };
      pageParams = pages.map((page) => ({
        pageSlug: page.slug,
        basePageId: page.baseId,
        customSlug: page.customSlug,
      }));
      break;
    }
    case ReduxActionTypes.CURRENT_APPLICATION_NAME_UPDATE: {
      const application = action.payload;
      appParams = {
        baseApplicationId: application.baseId,
        applicationSlug: application.slug,
        applicationVersion: application.applicationVersion,
      };
      break;
    }
    case ReduxActionTypes.FETCH_PAGE_LIST_SUCCESS: {
      const pages: Page[] = action.payload.pages;
      pageParams = pages.map((page) => ({
        pageSlug: page.slug,
        basePageId: page.basePageId,
        customSlug: page.customSlug,
      }));
      break;
    }
    case ReduxActionTypes.UPDATE_PAGE_SUCCESS: {
      const page: UpdatePageResponse = action.payload;
      pageParams = [
        {
          pageSlug: page.slug,
          basePageId: page.baseId,
          customSlug: page.customSlug,
        },
      ];
      break;
    }
    case ReduxActionTypes.CREATE_PAGE_SUCCESS: {
      const page: Page = action.payload;
      pageParams = [
        {
          pageSlug: page.slug,
          basePageId: page.basePageId,
          customSlug: page.customSlug,
        },
      ];
      break;
    }
    case ReduxActionTypes.GENERATE_TEMPLATE_PAGE_SUCCESS: {
      const { page } = action.payload;
      urlBuilder.updateURLParams(null, [
        {
          pageSlug: page.slug,
          basePageId: page.baseId,
          customSlug: page.customSlug,
        },
      ]);
      break;
    }
    case ReduxActionTypes.UPDATE_APPLICATION_SUCCESS:
      const application = action.payload;
      appParams = {
        baseApplicationId: application.baseid,
        applicationSlug: application.slug,
        applicationVersion: application.applicationVersion,
      };
      break;
    case ReduxActionTypes.CLONE_PAGE_SUCCESS:
      const { basePageId, pageSlug } = action.payload;
      pageParams = [
        {
          basePageId,
          pageSlug,
        },
      ];
      break;
    default:
      break;
  }
  urlBuilder.updateURLParams(appParams, pageParams);
};

const routeParamsMiddleware: Middleware =
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  () => (next: any) => (action: ReduxAction<any>) => {
    handler(action);
    return next(action);
  };

export default routeParamsMiddleware;
