import React from "react";
import { renderHook } from "@testing-library/react-hooks";
import { Provider } from "react-redux";
import configureStore from "redux-mock-store";

import { useBetterbugsMetadata } from "../useBetterbugsMetadata";

const mockStore = configureStore([]);

describe("useBetterbugsMetadata (CE)", () => {
  it("returns app and page ids from the store and null for workflow, package and module ids", () => {
    const store = mockStore({
      organization: { instanceId: "instance-1", tenantId: "tenant-1" },
      entities: {
        pageList: { applicationId: "app-1", currentPageId: "page-1" },
      },
    });

    const { result } = renderHook(() => useBetterbugsMetadata(), {
      wrapper: ({ children }: { children: React.ReactNode }) => (
        <Provider store={store}>{children}</Provider>
      ),
    });

    expect(result.current).toEqual({
      instanceId: "instance-1",
      tenantId: "tenant-1",
      applicationId: "app-1",
      pageId: "page-1",
      workflowId: null,
      packageId: null,
      moduleId: null,
    });
  });
});
