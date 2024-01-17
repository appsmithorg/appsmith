import type { Module } from "@appsmith/constants/ModuleConstants";
import type { ModuleInstance } from "@appsmith/constants/ModuleInstanceConstants";
import type { Package } from "@appsmith/constants/PackageConstants";
import { pick } from "lodash";
import AnalyticsUtil from "utils/AnalyticsUtil";

interface ModuleAnalytics extends Module {
  from?: string;
}

const createModuleInstance = (moduleInstance: ModuleInstance) => {
  const analyticsData = pick(moduleInstance, [
    "id",
    "applicationId",
    "contextId",
    "contextType",
    "inputs",
    "name",
    "sourceModuleId",
    "type",
  ]);

  AnalyticsUtil.logEvent("CREATE_MODULE_INSTANCE", analyticsData);
};

const updateModuleInstance = (moduleInstance: ModuleInstance) => {
  const analyticsData = pick(moduleInstance, [
    "id",
    "applicationId",
    "contextId",
    "contextType",
    "inputs",
    "name",
    "sourceModuleId",
    "type",
  ]);

  AnalyticsUtil.logEvent("UPDATE_MODULE_INSTANCE", analyticsData);
};

const deleteModuleInstance = (id: string) => {
  AnalyticsUtil.logEvent("DELETE_MODULE_INSTANCE", {
    id,
  });
};

const deleteModule = (id: string) => {
  AnalyticsUtil.logEvent("DELETE_MODULE", {
    id,
  });
};

const updateModule = (module: Module) => {
  const analyticsData = pick(module, [
    "id",
    "inputsForm",
    "name",
    "packageId",
    "type",
  ]);

  AnalyticsUtil.logEvent("UPDATE_MODULE", analyticsData);
};

const createModule = (module: ModuleAnalytics) => {
  const analyticsData = pick(module, [
    "id",
    "inputsForm",
    "name",
    "packageId",
    "type",
    "from",
  ]);

  AnalyticsUtil.logEvent("CREATE_MODULE", analyticsData);
};

const deletePackage = (id: string) => {
  AnalyticsUtil.logEvent("DELETE_PACKAGE", {
    id,
  });
};

const updatePackage = (pkg: Package) => {
  const analyticsData = pick(pkg, [
    "id",
    "name",
    "workspaceId",
    "color",
    "description",
    "icon",
  ]);

  AnalyticsUtil.logEvent("UPDATE_PACKAGE", analyticsData);
};

const createPackage = (pkg: Package) => {
  const analyticsData = pick(pkg, ["id", "name", "workspaceId"]);

  AnalyticsUtil.logEvent("CREATE_PACKAGE", analyticsData);
};

const publishPackage = (id: string) => {
  AnalyticsUtil.logEvent("PUBLISH_PACKAGE", { id });
};

const moduleAnalytics = {
  createModuleInstance,
  updateModuleInstance,
  deleteModuleInstance,
  deleteModule,
  updateModule,
  createModule,
  deletePackage,
  updatePackage,
  createPackage,
  publishPackage,
};

export default moduleAnalytics;
