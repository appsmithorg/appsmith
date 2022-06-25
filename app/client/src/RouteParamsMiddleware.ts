import {
  ApplicationPayload,
  Page,
  ReduxAction,
  ReduxActionTypes,
} from "@appsmith/constants/ReduxActionConstants";
import urlBuilder from "entities/URLRedirect/URLAssembly";
import { Middleware } from "redux";
import { updateSlugNamesInURL } from "utils/helpers";

const routeParamsMiddleware: Middleware = () => (next: any) => (
  action: ReduxAction<any>,
) => {
  switch (action.type) {
    case ReduxActionTypes.DUPLICATE_APPLICATION_SUCCESS:
    case ReduxActionTypes.IMPORT_APPLICATION_SUCCESS:
    case ReduxActionTypes.FETCH_APPLICATION_SUCCESS: {
      const application: ApplicationPayload = action.payload;
      const { pages } = application;
      urlBuilder.updateURLParams(
        {
          applicationId: application.id,
          applicationSlug: application.slug,
          applicationVersion: application.applicationVersion,
        },
        pages.map((page) => ({
          pageSlug: page.slug,
          pageId: page.id,
          customSlug: page.customSlug,
        })),
      );
      break;
    }
    case ReduxActionTypes.FORK_APPLICATION_SUCCESS:
    case ReduxActionTypes.CREATE_APPLICATION_SUCCESS: {
      const application: ApplicationPayload = action.payload.application;
      const { pages } = application;
      urlBuilder.updateURLParams(
        {
          applicationId: application.id,
          applicationSlug: application.slug,
          applicationVersion: application.applicationVersion,
        },
        pages.map((page) => ({
          pageSlug: page.slug,
          pageId: page.id,
          customSlug: page.customSlug,
        })),
      );
      break;
    }
    case ReduxActionTypes.CURRENT_APPLICATION_NAME_UPDATE: {
      const application = action.payload;
      urlBuilder.updateURLParams({
        applicationId: application.id,
        applicationSlug: application.slug,
        applicationVersion: application.applicationVersion,
      });
      updateSlugNamesInURL({
        applicationSlug: application.slug,
      });
      break;
    }
    case ReduxActionTypes.FETCH_PAGE_LIST_SUCCESS: {
      const pages: Page[] = action.payload.pages;
      urlBuilder.updateURLParams(
        null,
        pages.map((page) => ({
          pageSlug: page.slug,
          pageId: page.pageId,
          customSlug: page.customSlug,
        })),
      );
      break;
    }
    case ReduxActionTypes.UPDATE_PAGE_SUCCESS: {
      const page = action.payload;
      urlBuilder.updateURLParams(null, [
        {
          pageSlug: page.slug,
          pageId: page.id,
          customSlug: page.customSlug,
        },
      ]);
      //TODO: Update URL here
      break;
    }
    case ReduxActionTypes.CREATE_PAGE_SUCCESS: {
      const page: Page = action.payload;
      urlBuilder.updateURLParams(null, [
        {
          pageSlug: page.slug,
          pageId: page.pageId,
          customSlug: page.customSlug,
        },
      ]);
      break;
    }
    case ReduxActionTypes.UPDATE_APPLICATION_SUCCESS:
      const application = action.payload;
      urlBuilder.updateURLParams({
        applicationId: application.id,
        applicationSlug: application.slug,
        applicationVersion: application.applicationVersion,
      });
      break;
    default:
      break;
  }
  return next(action);
};

export default routeParamsMiddleware;
