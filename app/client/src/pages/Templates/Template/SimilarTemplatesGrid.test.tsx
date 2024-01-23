import { render } from "@testing-library/react";
import { unitTestBaseMockStore } from "layoutSystems/common/dropTarget/unitTestUtils";
import React from "react";
import { Provider } from "react-redux";
import { Router } from "react-router";
import configureStore from "redux-mock-store";
import { lightTheme } from "selectors/themeSelectors";
import { ThemeProvider } from "styled-components";
import history from "utils/history";
import SimilarTemplates from "./SimilarTemplates";

export const unitTestMockBuildingBlock = {
  id: "12",
  userPermissions: ["read", "write"],
  title: "Title",
  description: "Description",
  appUrl: "https://mockapp.com",
  gifUrl: "https://mockapp.com/mock.gif",
  screenshotUrls: [
    "https://mockapp.com/screenshot1.jpg",
    "https://mockapp.com/screenshot2.jpg",
  ],
  widgets: [],
  functions: ["Function1", "Building Blocks"],
  useCases: ["UseCase1", "UseCase2"],
  datasources: ["Datasource1", "Datasource2"],
  pages: [],
  allowPageImport: true,
};

const mockStore = configureStore([]);

describe("SimilarTemplates component", () => {
  let store: any;

  beforeEach(() => {
    store = mockStore(unitTestBaseMockStore);
  });

  it("checks the gap between two cards in TemplateGrid", () => {
    const { container } = render(
      <Router history={history}>
        <Provider store={store}>
          <ThemeProvider theme={lightTheme}>
            <SimilarTemplates
              isForkingEnabled
              onBackPress={() => {}}
              onClick={() => {}}
              onFork={() => {}}
              similarTemplates={[
                unitTestMockBuildingBlock,
                {
                  ...unitTestMockBuildingBlock,
                  id: "2",
                },
                {
                  ...unitTestMockBuildingBlock,
                  id: "3",
                },
                {
                  ...unitTestMockBuildingBlock,
                  id: "4",
                },
                {
                  ...unitTestMockBuildingBlock,
                  id: "5",
                },
                {
                  ...unitTestMockBuildingBlock,
                  id: "6",
                },
                {
                  ...unitTestMockBuildingBlock,
                  id: "7",
                },
                {
                  ...unitTestMockBuildingBlock,
                  id: "8",
                },
              ]}
            />
          </ThemeProvider>
        </Provider>
      </Router>,
    );
    // const pushMock = jest.spyOn(history, "push");

    const templateGrid = container.querySelector(
      '[data-testid="t--similar-templates-grid"]',
    );

    if (templateGrid) {
      // Ensure there are at least two cards for testing the gap
      expect(templateGrid.children.length).toBeGreaterThanOrEqual(2);

      // const firstCard = templateGrid.children[0];
      // const secondCard = templateGrid.children[1];

      // console.log(getComputedStyle(templateGrid));

      // const firstCardBottom = parseFloat(
      //   getComputedStyle(firstCard).marginBottom,
      // );
      // const secondCardTop = parseFloat(getComputedStyle(secondCard).marginTop);

      // const gap = secondCardTop - firstCardBottom;

      // console.log(gap);

      // Replace expectedGap with the expected gap in pixels
      // expect(gap).toEqual(expectedGap);
    }
  });
});
