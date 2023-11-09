export * from "ce/RouteParamsMiddleware";
import { handler as CE_Handler } from "ce/RouteParamsMiddleware";
import type { Middleware } from "redux";
import {
  ReduxActionTypes,
  type ReduxAction,
} from "@appsmith/constants/ReduxActionConstants";
import type { FetchPackageResponse } from "./api/PackageApi";
import type {
  ModulesParams,
  PackageParams,
} from "./entities/URLRedirect/URLAssembly";
import urlBuilder from "./entities/URLRedirect/URLAssembly";
import type { Package } from "./constants/PackageConstants";
import { klona } from "klona";
import type { Module } from "./constants/ModuleConstants";

const handler = (action: ReduxAction<any>) => {
  switch (action.type) {
    case ReduxActionTypes.FETCH_PACKAGE_SUCCESS: {
      const { modules, packageData }: FetchPackageResponse = action.payload;
      const modulesParams: ModulesParams = {};
      const packageParams: PackageParams = {
        packageId: packageData.id,
        packageSlug: "", // TODO (Ashit) Update slugs
      };

      modules.forEach(({ id }) => {
        modulesParams[id] = {
          moduleId: id,
          moduleSlug: "", // TODO (Ashit) Update slugs
        };
      });

      urlBuilder.setPackageParams(packageParams);
      urlBuilder.setModulesParams(() => modulesParams);
      break;
    }
    case ReduxActionTypes.CREATE_PACKAGE_FROM_WORKSPACE_SUCCESS: {
      const pkg: Package = action.payload;
      const modulesParams: ModulesParams = {};
      const packageParams: PackageParams = {
        packageId: pkg.id,
        packageSlug: "", // TODO (Ashit) Update slugs
      };

      urlBuilder.setPackageParams(packageParams);
      urlBuilder.setModulesParams(() => modulesParams);
      break;
    }
    case ReduxActionTypes.UPDATE_PACKAGE_SUCCESS: {
      const pkg: Package = action.payload;
      const packageParams: PackageParams = {
        packageId: pkg.id,
        packageSlug: "", // TODO (Ashit) Update slugs
      };

      urlBuilder.setPackageParams(packageParams);
      break;
    }
    case ReduxActionTypes.SAVE_MODULE_NAME_SUCCESS:
    case ReduxActionTypes.CREATE_QUERY_MODULE_SUCCESS: {
      const module: Module = action.payload;

      urlBuilder.setModulesParams((currentParams) => {
        const updatedParams = klona(currentParams);
        updatedParams[module.id] = {
          moduleId: module.id,
          moduleSlug: "", //TODO (Ashit) Update slugs
        };

        return updatedParams;
      });
      break;
    }
  }
};

const routeParamsMiddleware: Middleware =
  () => (next: any) => (action: ReduxAction<any>) => {
    CE_Handler(action);
    handler(action);

    return next(action);
  };

export default routeParamsMiddleware;
