import { render, screen } from "test/testUtils";
import React from "react";
import { DisconnectService } from "./DisconnectService";
import {
  createMessage,
  DISCONNECT_AUTH_METHOD,
  DISCONNECT_CONFIRMATION,
} from "@appsmith/constants/messages";

let container: any = null;
const buttonClickHandler = jest.fn();

const useSelector = jest.fn();
const values = {
  subHeader: "some subheader value",
  warning: "some warning",
};
useSelector.mockReturnValue(values);

function renderComponent() {
  render(
    <DisconnectService
      disconnect={() => buttonClickHandler()}
      subHeader={values.subHeader}
      warning={values.warning}
    />,
  );
}

describe("Disconnect Service", () => {
  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
  });

  it("is rendered", () => {
    renderComponent();
    const disconnectBtn = screen.queryAllByTestId("disconnect-service-button");
    expect(disconnectBtn).toHaveLength(1);
    expect(disconnectBtn[0].textContent).toEqual(
      createMessage(DISCONNECT_AUTH_METHOD),
    );
    disconnectBtn[0].click();
    expect(disconnectBtn[0].textContent).toEqual(
      createMessage(DISCONNECT_CONFIRMATION),
    );
  });
});
