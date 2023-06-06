import { cloneableGenerator } from "@redux-saga/testing-utils";
import { call, cancel, delay, fork, put, take } from "redux-saga/effects";
import {
  fetchCurrentTenantConfigSaga,
  forceLicenseCheckSaga,
  initLicenseStatusCheckSaga,
  startLicenseStatusCheckSaga,
} from "./tenantSagas";
import {
  ReduxActionTypes,
  ReduxActionErrorTypes,
} from "@appsmith/constants/ReduxActionConstants";
import { TenantApi } from "@appsmith/api/TenantApi";
import { validateResponse } from "sagas/ErrorSagas";
import { defaultBrandingConfig as CE_defaultBrandingConfig } from "@appsmith/reducers/tenantReducer";
import { PAGE_NOT_FOUND_URL, SETUP, USER_AUTH_URL } from "constants/routes";
import { ERROR_CODES } from "@appsmith/constants/ApiConstants";
import { AxiosError } from "axios";

const response = {
  responseMeta: {
    status: 200,
    success: true,
  },
  data: {
    userPermissions: [
      "tenantManageAllUsers:tenant",
      "createUserGroups:tenant",
      "tenantReadUserGroups:tenant",
      "tenantManageUserGroups:tenant",
      "tenantManagePermissionGroups:tenant",
      "tenantDeletePermissionGroups:tenant",
      "tenantAddUsersToGroups:tenant",
      "tenantReadPermissionGroups:tenant",
      "tenantRemoveUserFromGroups:tenant",
      "createPermissionGroups:tenant",
      "tenantAssignPermissionGroups:tenant",
      "readAuditLogs:tenant",
      "tenantDeleteUserGroups:tenant",
      "createWorkspaces:tenant",
      "manage:tenants",
      "tenantUnassignPermissionGroups:tenant",
    ],
    instanceId: "64078a3db929e35d8e7ceb66",
    tenantConfiguration: {
      license: {
        active: true,
        key: "VALID_LICENSE_KEY",
        type: "PAID",
        expiry: 1678457500,
        status: "ACTIVE",
        origin: "SELF_SERVE",
      },
      brandLogoUrl: "https://assets.appsmith.com/appsmith-logo.svg",
      brandFaviconUrl:
        "https://assets.appsmith.com/appsmith-favicon-orange.ico",
    },
    new: true,
  },
  errorDisplay: "",
} as any;

describe("fetchCurrentTenantConfigSaga", () => {
  it("should fetch and set the current tenant config on success", () => {
    const gen = cloneableGenerator(fetchCurrentTenantConfigSaga)();
    let clone;

    expect(gen.next().value).toEqual(call(TenantApi.fetchCurrentTenantConfig));

    // Test successful response
    clone = gen.clone();
    expect(clone.next(response).value).toEqual(validateResponse(response));
    expect(clone.next(true).value).toEqual(
      put({
        type: ReduxActionTypes.FETCH_CURRENT_TENANT_CONFIG_SUCCESS,
        payload: {
          ...response.data,
          tenantConfiguration: {
            ...CE_defaultBrandingConfig,
            ...response.data.tenantConfiguration,
          },
        },
      }),
    );
    expect(clone.next().done).toBe(true);

    // Test invalid response
    clone = gen.clone();
    expect(clone.next(response).value).toEqual(validateResponse(response));
    expect(clone.next(false).done).toBe(true);
  });

  it("should handle errors", () => {
    const errorObj = new AxiosError("Fetch error");
    const gen = cloneableGenerator(fetchCurrentTenantConfigSaga)();

    expect(gen.next().value).toEqual(call(TenantApi.fetchCurrentTenantConfig));
    expect(gen?.throw?.(errorObj).value).toEqual(
      put({
        type: ReduxActionErrorTypes.FETCH_CURRENT_TENANT_CONFIG_ERROR,
        payload: {
          errorObj,
        },
      }),
    );
    expect(gen?.next().value).toEqual(
      put({
        type: ReduxActionTypes.SAFE_CRASH_APPSMITH_REQUEST,
        payload: {
          code: errorObj.code ?? ERROR_CODES.SERVER_ERROR,
        },
      }),
    );
    expect(gen.next().done).toBe(true);
  });
});

describe("initLicenseStatusCheckSaga", () => {
  const testCases = [
    { url: "http://test.com", skipLicenseCheck: false },
    { url: `http://test.com/${USER_AUTH_URL}`, skipLicenseCheck: true },
    { url: `http://test.com/${SETUP}`, skipLicenseCheck: true },
    { url: `http://test.com/${PAGE_NOT_FOUND_URL}`, skipLicenseCheck: true },
  ];

  testCases.forEach(({ skipLicenseCheck, url }) => {
    it(`should ${
      skipLicenseCheck ? "not " : ""
    }fork startLicenseStatusCheckSaga for URL ${url}`, () => {
      const gen = cloneableGenerator(initLicenseStatusCheckSaga as any)();

      Object.defineProperty(window, "location", {
        value: new URL(url),
        writable: true,
      });

      if (skipLicenseCheck) {
        expect(gen.next().value).toEqual(undefined);
        expect(gen.next().done).toBe(true);
      } else {
        expect(gen.next().value).toEqual(delay(60 * 60 * 1000));
        expect(gen.next().value).toEqual(fork(startLicenseStatusCheckSaga));
        expect(gen.next().value).toEqual(
          take(ReduxActionTypes.STOP_LICENSE_STATUS_CHECK),
        );
        expect(gen.next().value).toEqual(cancel());
        expect(gen.next().done).toBe(true);
      }
    });
  });
});

describe("forceLicenseCheckSaga", () => {
  it("should handle successful license check", () => {
    const gen = cloneableGenerator(forceLicenseCheckSaga as any)();
    expect(gen.next().value).toEqual(call(TenantApi.forceCheckLicense));
    const clone1 = gen.clone();
    expect(clone1.next(response).value).toEqual(validateResponse(response));
    expect(clone1.next(true).value).toEqual(
      put({
        type: ReduxActionTypes.FORCE_LICENSE_CHECK_SUCCESS,
        payload: response.data,
      }),
    );
    expect(clone1.next().done).toBe(true);
  });

  it("should handle license check error", () => {
    const gen = cloneableGenerator(forceLicenseCheckSaga as any)();
    expect(gen.next().value).toEqual(call(TenantApi.forceCheckLicense));
    const error = new Error("License check failed");
    expect(gen?.throw?.(error).value).toEqual(
      put({
        type: ReduxActionErrorTypes.FORCE_LICENSE_CHECK_ERROR,
        payload: {
          error,
        },
      }),
    );
    expect(gen.next().done).toBe(true);
  });
});
