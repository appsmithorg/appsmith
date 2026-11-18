import "@testing-library/jest-dom/extend-expect";
import React from "react";
import { render } from "@testing-library/react";
import { useForm } from "react-hook-form";

import SettingsForm from "./SettingsForm";
import type { Inputs } from "./BrandingPage";

jest.mock("utils/hooks/useFeatureFlag", () => ({
  useFeatureFlag: () => false,
}));

jest.mock("ee/pages/AdminSettings/Branding/useBrandingForm", () => ({
  useBrandingForm: () => ({ onSubmit: jest.fn() }),
}));

jest.mock("ee/utils/airgapHelpers", () => ({
  getAssetUrl: (url: string) => url,
}));

const defaultValues: Inputs = {
  brandColors: {
    primary: "#E15615",
    background: "#F1F5F9",
    font: "#FFFFFF",
    hover: "#C24A10",
    disabled: "#FCE6DC",
  },
  brandLogo: "logo.png",
  brandFavicon: "favicon.ico",
};

function Harness() {
  const form = useForm<Inputs>({ defaultValues });

  return (
    <SettingsForm
      control={form.control}
      defaultValues={defaultValues}
      formState={form.formState}
      handleSubmit={form.handleSubmit}
      reset={form.reset}
      resetField={form.resetField}
      setValue={form.setValue}
      values={defaultValues}
    />
  );
}

describe("SettingsForm", () => {
  it("limits the logo file picker to JPEG and PNG", () => {
    const { container } = render(<Harness />);

    const logoInput = container.querySelector(
      ".t--settings-brand-logo-input input[type=file]",
    );

    expect(logoInput).toHaveAttribute("accept", "image/jpeg,image/png");
  });
});
