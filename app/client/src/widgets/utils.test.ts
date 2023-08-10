import { getVideoConstraints } from "./utils";

describe("getVideoConstraints", () => {
  test("returns default video constraints when no deviceId and not mobile", () => {
    const prevConstraints = { width: { ideal: 1280 }, height: { ideal: 720 } };
    const defaultCamera = "environment";
    const isMobile = false;

    const constraints = getVideoConstraints(
      prevConstraints,
      isMobile,
      defaultCamera,
    );

    expect(constraints).toEqual(prevConstraints);
  });

  test("returns video constraints with deviceId when deviceId is provided", () => {
    const prevConstraints = { width: { ideal: 1280 }, height: { ideal: 720 } };
    const defaultCamera = "environment";
    const isMobile = false;
    const deviceId = "test-device-id";

    const constraints = getVideoConstraints(
      prevConstraints,
      isMobile,
      defaultCamera,
      deviceId,
    );

    expect(constraints).toEqual({
      ...prevConstraints,
      deviceId: "test-device-id",
    });
  });

  test("returns video constraints with facingMode when isMobile is true", () => {
    const prevConstraints = { width: { ideal: 1280 }, height: { ideal: 720 } };
    const defaultCamera = "environment";
    const isMobile = true;

    const constraints = getVideoConstraints(
      prevConstraints,
      isMobile,
      defaultCamera,
    );

    expect(constraints).toEqual({
      ...prevConstraints,
      facingMode: { ideal: "environment" },
    });
  });

  test("returns video constraints with both deviceId and facingMode when provided", () => {
    const prevConstraints = { width: { ideal: 1280 }, height: { ideal: 720 } };
    const defaultCamera = "environment";
    const isMobile = true;
    const deviceId = "test-device-id";

    const constraints = getVideoConstraints(
      prevConstraints,
      isMobile,
      defaultCamera,
      deviceId,
    );

    expect(constraints).toEqual({
      ...prevConstraints,
      deviceId: "test-device-id",
      facingMode: { ideal: "environment" },
    });
  });
});
