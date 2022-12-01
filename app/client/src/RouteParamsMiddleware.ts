import {
  ApplicationPayload,
  Page,
  ReduxAction,
  ReduxActionTypes,
} from "@appsmith/constants/ReduxActionConstants";
import urlBuilder, {
  ApplicationURLParams,
  PageURLParams,
} from "entities/URLRedirect/URLAssembly";
import { Middleware } from "redux";

const routeParamsMiddleware: Middleware = () => (next: any) => (
  action: ReduxAction<any>,
) => {
  let appParams: ApplicationURLParams = {};
  let pageParams: PageURLParams[] = [];
  switch (action.type) {
    case ReduxActionTypes.DUPLICATE_APPLICATION_SUCCESS:
    case ReduxActionTypes.IMPORT_APPLICATION_SUCCESS:
    case ReduxActionTypes.IMPORT_TEMPLATE_TO_WORKSPACE_SUCCESS:
    case ReduxActionTypes.FETCH_APPLICATION_SUCCESS: {
      const application: ApplicationPayload = action.payload;
      const { pages } = application;
      appParams = {
        applicationId: application.id,
        applicationSlug: application.slug,
        applicationVersion: application.applicationVersion,
      };
      pageParams = pages.map((page) => ({
        pageSlug: page.slug,
        pageId: page.id,
        customSlug: page.customSlug,
      }));
      break;
    }
    case ReduxActionTypes.FORK_APPLICATION_SUCCESS:
    case ReduxActionTypes.CREATE_APPLICATION_SUCCESS: {
      const application: ApplicationPayload = action.payload.application;
      const { pages } = application;
      appParams = {
        applicationId: application.id,
        applicationSlug: application.slug,
        applicationVersion: application.applicationVersion,
      };
      pageParams = pages.map((page) => ({
        pageSlug: page.slug,
        pageId: page.id,
        customSlug: page.customSlug,
      }));
      break;
    }
    case ReduxActionTypes.CURRENT_APPLICATION_NAME_UPDATE: {
      const application = action.payload;
      appParams = {
        applicationId: application.id,
        applicationSlug: application.slug,
        applicationVersion: application.applicationVersion,
      };
      break;
    }
    case ReduxActionTypes.FETCH_PAGE_LIST_SUCCESS: {
      const pages: Page[] = action.payload.pages;
      pageParams = pages.map((page) => ({
        pageSlug: page.slug,
        pageId: page.pageId,
        customSlug: page.customSlug,
      }));
      break;
    }
    case ReduxActionTypes.UPDATE_PAGE_SUCCESS: {
      const page = action.payload;
      pageParams = [
        {
          pageSlug: page.slug,
          pageId: page.id,
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
          pageId: page.pageId,
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
          pageId: page.id,
          customSlug: page.customSlug,
        },
      ]);
      break;
    }
    case ReduxActionTypes.UPDATE_APPLICATION_SUCCESS:
      const application = action.payload;
      appParams = {
        applicationId: application.id,
        applicationSlug: application.slug,
        applicationVersion: application.applicationVersion,
      };
      break;
    case ReduxActionTypes.CLONE_PAGE_SUCCESS:
      const { pageId, pageSlug } = action.payload;
      pageParams = [
        {
          pageId,
          pageSlug,
        },
      ];
      break;
    default:
      break;
  }
  urlBuilder.updateURLParams(appParams, pageParams);
  return next(action);
};

export default routeParamsMiddleware;
