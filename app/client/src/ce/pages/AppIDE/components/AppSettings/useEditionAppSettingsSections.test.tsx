import { renderHook } from "@testing-library/react-hooks";
import { AppSettingsTabs } from "pages/AppIDE/components/AppSettings/types";
import { useEditionAppSettingsSections } from "./useEditionAppSettingsSections";

describe("useEditionAppSettingsSections (community edition)", () => {
  it("adds no headers and renders no section", () => {
    const { result } = renderHook(() =>
      useEditionAppSettingsSections({
        selectedTab: { type: AppSettingsTabs.General },
        setSelectedTab: jest.fn(),
      }),
    );

    expect(result.current.headers).toEqual([]);
    expect(
      result.current.renderSection({
        type: AppSettingsTabs.Edition,
        editionSectionId: "any",
      }),
    ).toBeNull();
  });
});
