import React from "react";
import "@testing-library/jest-dom";
import { screen } from "@testing-library/react";
import DataSidePane from "./DataSidePane";
import { datasourceFactory } from "test/factories/DatasourceFactory";
import { getIDETestState } from "test/factories/AppIDEFactoryUtils";
import { PostgresFactory } from "test/factories/Actions/Postgres";
import type { AppState } from "ee/reducers";
import { render } from "test/testUtils";

const productsDS = datasourceFactory().build({
  name: "Products",
  id: "products-ds-id",
});
const usersDS = datasourceFactory().build({ name: "Users", id: "users-ds-id" });
const ordersDS = datasourceFactory().build({
  name: "Orders",
  id: "orders-ds-id",
});
const usersAction1 = PostgresFactory.build({
  datasource: {
    id: usersDS.id,
  },
});
const usersAction2 = PostgresFactory.build({
  datasource: {
    id: usersDS.id,
  },
});
const ordersAction1 = PostgresFactory.build({
  datasource: {
    id: ordersDS.id,
  },
});

describe("DataSidePane", () => {
  it("renders the ds and count by using the default selector if dsUsageSelector not passed as a props", () => {
    const state = getIDETestState({
      actions: [usersAction1, usersAction2, ordersAction1],
      datasources: [productsDS, usersDS, ordersDS],
    }) as AppState;

    render(<DataSidePane />, {
      url: "app/untitled-application-1/page1/edit/datasource/users-ds-id",
      initialState: state,
    });

    expect(screen.getByText("Databases")).toBeInTheDocument();
    expect(screen.getByText("Products")).toBeInTheDocument();
    expect(screen.getByText("Users")).toBeInTheDocument();

    const usersDSParentElement =
      screen.getByText("Users").parentElement?.parentElement;

    expect(usersDSParentElement).toHaveTextContent("2 queries in this app");

    const productsDSParentElement =
      screen.getByText("Products").parentElement?.parentElement;

    expect(productsDSParentElement).toHaveTextContent("No queries in this app");

    const ortdersDSParentElement =
      screen.getByText("Orders").parentElement?.parentElement;

    expect(ortdersDSParentElement).toHaveTextContent("1 queries in this app");
  });

  it("it uses the selector dsUsageSelector passed as prop", () => {
    const state = getIDETestState({
      datasources: [productsDS, usersDS, ordersDS],
    }) as AppState;

    const usageSelector = () => {
      return {
        [usersDS.id]: "Rendering description for users",
        [productsDS.id]: "Rendering description for products",
      };
    };

    render(<DataSidePane dsUsageSelector={usageSelector} />, {
      url: "app/untitled-application-1/page1/edit/datasource/users-ds-id",
      initialState: state,
    });

    expect(screen.getByText("Databases")).toBeInTheDocument();
    expect(screen.getByText("Products")).toBeInTheDocument();
    expect(screen.getByText("Users")).toBeInTheDocument();

    const usersDSParentElement =
      screen.getByText("Users").parentElement?.parentElement;

    expect(usersDSParentElement).toHaveTextContent(
      "Rendering description for users",
    );

    const productsDSParentElement =
      screen.getByText("Products").parentElement?.parentElement;

    expect(productsDSParentElement).toHaveTextContent(
      "Rendering description for products",
    );
  });
});
