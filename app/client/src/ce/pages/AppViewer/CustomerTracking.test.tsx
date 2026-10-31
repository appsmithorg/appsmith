import React from "react";
import { render } from "@testing-library/react";
import CustomerTracking from "./CustomerTracking";
import CustomerTrackingSettings from "../AppIDE/components/AppSettings/CustomerTrackingSettings";
import type { ApplicationPayload } from "entities/Application";

it("does not expose settings or execute imported tracking configuration in CE", () => {
  const application = {
    applicationDetail: {
      googleAnalyticsId: "G-ABC1234567",
      googleTagManagerId: "GTM-ABCD",
    },
  } as unknown as ApplicationPayload;
  const { container } = render(
    <>
      <CustomerTracking application={application} />
      <CustomerTrackingSettings />
    </>,
  );

  expect(container.innerHTML).toBe("");
  expect(
    document.querySelector('script[src*="googletagmanager.com"]'),
  ).toBeNull();
});
