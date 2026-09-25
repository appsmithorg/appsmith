import axios, { AxiosError } from "axios";
import type { InternalAxiosRequestConfig } from "axios";
import { call } from "redux-saga/effects";
import { expectSaga } from "redux-saga-test-plan";
import * as matchers from "redux-saga-test-plan/matchers";

import Api from "api/Api";
import {
  apiFailureResponseInterceptor,
  apiSuccessResponseInterceptor,
} from "api/interceptors";
import { ReduxActionErrorTypes } from "ee/constants/ReduxActionConstants";
import type { Action } from "entities/Action";
import { APP_MODE } from "entities/App";
import { getAppMode } from "ee/selectors/applicationSelectors";
import { executePluginActionSaga, getActionTimeout } from "./PluginActionSaga";
import { PluginActionExecutionError } from "./errorUtils";

const ACL_NO_ACCESS_MESSAGE =
  "You do not have access to this environment. Please contact your workspace administrator to gain access";

// An AppsmithException response: only responseMeta, no `data`
const errorEnvelope = (status: number) => ({
  responseMeta: {
    status,
    success: false,
    error: { code: 4028, message: ACL_NO_ACCESS_MESSAGE },
  },
});

const pluginAction = {
  id: "action-id",
  baseId: "base-action-id",
  name: "GetInvoices",
  jsonPathKeys: [],
  confirmBeforeExecute: false,
} as unknown as Action;

// Stubs the execute request with a fixed HTTP response and passes it through
// the real response interceptors. test/setup replaces the Api client with an
// empty class, so the saga's Api.post call is routed to this instance.
function respondToExecuteWith(status: number, data: unknown) {
  const http = axios.create({
    adapter: async (config: InternalAxiosRequestConfig) => {
      const response = { status, statusText: "", headers: {}, config, data };

      if (status >= 200 && status < 300) {
        return response;
      }

      throw new AxiosError(
        `Request failed with status code ${status}`,
        AxiosError.ERR_BAD_REQUEST,
        config,
        {},
        response,
      );
    },
  });

  http.interceptors.response.use(
    apiSuccessResponseInterceptor,
    apiFailureResponseInterceptor,
  );

  Api.post = async (url, body, _queryParams, config) =>
    http.post(url, body, config);
}

// Returns the error the saga throws, so the test can also inspect its effects
function* executeAndCatch() {
  try {
    yield call(executePluginActionSaga, pluginAction);
  } catch (error) {
    return error;
  }
}

const runSaga = async (saga: () => Generator) =>
  expectSaga(saga)
    .provide([
      [matchers.select.selector(getAppMode), APP_MODE.PUBLISHED],
      [matchers.select.selector(getActionTimeout), undefined],
    ])
    .run({ silenceTimeout: true });

describe("executePluginActionSaga", () => {
  afterEach(() => {
    delete (Api as { post?: unknown }).post;
  });

  it.each([401, 403, 500])(
    "throws the server's message when a %i execute response is an error envelope without data",
    async (status) => {
      respondToExecuteWith(status, errorEnvelope(status));

      const { returnValue: error } = await runSaga(executeAndCatch);

      expect(error).toBeInstanceOf(PluginActionExecutionError);
      expect(error.message).toBe(ACL_NO_ACCESS_MESSAGE);
    },
  );

  it("does not show a toast for an error envelope, leaving that to the callers", async () => {
    respondToExecuteWith(401, errorEnvelope(401));

    const { effects } = await runSaga(executeAndCatch);
    const apiErrors = effects.put
      .map((effect) => effect.payload.action)
      .filter(({ type }) => type === ReduxActionErrorTypes.API_ERROR);

    expect(apiErrors).toHaveLength(1);
    expect(apiErrors[0].payload.show).toBe(false);
  });

  it("returns an error result when the plugin reports a failed execution", async () => {
    respondToExecuteWith(200, {
      responseMeta: { status: 200, success: true },
      data: {
        isExecutionSuccess: false,
        statusCode: "PE-PGS-5000",
        body: 'relation "invoices" does not exist',
        headers: {},
        request: {},
      },
    });

    const { returnValue } = await runSaga(function* () {
      return yield call(executePluginActionSaga, pluginAction);
    });

    expect(returnValue.isError).toBe(true);
    expect(returnValue.payload.body).toBe('relation "invoices" does not exist');
  });
});
