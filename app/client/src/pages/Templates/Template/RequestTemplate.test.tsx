import { createMessage } from "@appsmith/ads-old";
import "@testing-library/jest-dom";
import { fireEvent, render } from "@testing-library/react";
import {
  REQUEST_BUILDING_BLOCK,
  REQUEST_TEMPLATE,
} from "ee/constants/messages";
import AnalyticsUtil from "ee/utils/AnalyticsUtil";
import { unitTestBaseMockStore } from "layoutSystems/common/dropTarget/unitTestUtils";
import React from "react";
import { Provider } from "react-redux";
import configureStore from "redux-mock-store";
import { lightTheme } from "selectors/themeSelectors";
import { ThemeProvider } from "styled-components";
import RequestTemplate, {
  REQUEST_TEMPLATE_URL,
  type RequestTemplateProps,
} from "./RequestTemplate";
const mockStore = configureStore([]);

const BaseComponentRender = (
  props: RequestTemplateProps,
  storeToUse = unitTestBaseMockStore,
) => (
  <Provider store={mockStore(storeToUse)}>
    <ThemeProvider theme={lightTheme}>
      <RequestTemplate {...props} />
    </ThemeProvider>
  </Provider>
);

describe("RequestTemplate", () => {
  it("should display correct message based on isBuildingBlock prop", () => {
    const { getByText } = render(
      BaseComponentRender({ isBuildingBlock: true }),
    );

    expect(
      getByText(createMessage(REQUEST_BUILDING_BLOCK)),
    ).toBeInTheDocument();
  });
  it("should open REQUEST_TEMPLATE_URL in a new window when button is clicked", () => {
    const openSpy = jest.spyOn(window, "open");
    const { getByText } = render(
      BaseComponentRender({ isBuildingBlock: false }),
    );
    const button = getByText(createMessage(REQUEST_TEMPLATE));

    fireEvent.click(button);
    expect(openSpy).toHaveBeenCalledWith(REQUEST_TEMPLATE_URL);
  });

  it('should trigger AnalyticsUtil logEvent with "REQUEST_NEW_TEMPLATE" when button is clicked', () => {
    const logEventSpy = jest.spyOn(AnalyticsUtil, "logEvent");
    const { getByText } = render(
      BaseComponentRender({ isBuildingBlock: false }),
    );
    const button = getByText(createMessage(REQUEST_TEMPLATE));

    fireEvent.click(button);
    expect(logEventSpy).toHaveBeenCalledWith("REQUEST_NEW_TEMPLATE");
  });
});
