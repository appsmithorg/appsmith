import getPullBtnStatus from "./getPullButtonStatus";
import type { GetPullButtonStatusParams } from "./getPullButtonStatus";

describe("getPullBtnStatus", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return disabled with message "No commits to pull" when behindCount is 0', () => {
    const params: GetPullButtonStatusParams = {
      isProtectedMode: false,
      isPullFailing: false,
      isStatusClean: true,
      statusBehindCount: 0,
    };

    const result = getPullBtnStatus(params);

    expect(result).toEqual({
      isDisabled: true,
      message:
        "No commits to pull. This branch is in sync with the remote repository",
    });
  });

  it('should return disabled with message "Cannot pull with local uncommitted changes" when isClean is false and isProtectedMode is false', () => {
    const params: GetPullButtonStatusParams = {
      isProtectedMode: false,
      isPullFailing: false,
      isStatusClean: false,
      statusBehindCount: 5,
    };

    const result = getPullBtnStatus(params);

    expect(result).toEqual({
      isDisabled: true,
      message:
        "You have uncommitted changes. Please commit or discard before pulling the remote changes.",
    });
  });

  it('should return enabled with message "Pull changes" when isClean is false, isProtectedMode is true, and behindCount > 0', () => {
    const params: GetPullButtonStatusParams = {
      isProtectedMode: true,
      isPullFailing: false,
      isStatusClean: false,
      statusBehindCount: 3,
    };

    const result = getPullBtnStatus(params);

    expect(result).toEqual({
      isDisabled: false,
      message: "Pull changes",
    });
  });

  it('should return message "Conflicts found" when pullFailed is true', () => {
    const params: GetPullButtonStatusParams = {
      isProtectedMode: false,
      isPullFailing: true,
      isStatusClean: true,
      statusBehindCount: 2,
    };

    const result = getPullBtnStatus(params);

    expect(result).toEqual({
      isDisabled: false,
      message: "Conflicts found. Please resolve them and pull again.",
    });
  });

  it('should return enabled with message "Pull changes" when behindCount > 0 and no other conditions met', () => {
    const params: GetPullButtonStatusParams = {
      isProtectedMode: false,
      isPullFailing: false,
      isStatusClean: true,
      statusBehindCount: 1,
    };

    const result = getPullBtnStatus(params);

    expect(result).toEqual({
      isDisabled: false,
      message: "Pull changes",
    });
  });

  it('should return disabled with message "No commits to pull" when behindCount is 0 regardless of isClean and isProtectedMode', () => {
    const params: GetPullButtonStatusParams = {
      isProtectedMode: true,
      isPullFailing: false,
      isStatusClean: false,
      statusBehindCount: 0,
    };

    const result = getPullBtnStatus(params);

    expect(result).toEqual({
      disabled: true,
      message:
        "No commits to pull. This branch is in sync with the remote repository",
    });
  });

  it("should prioritize pullFailed over other conditions", () => {
    const params: GetPullButtonStatusParams = {
      isProtectedMode: false,
      isPullFailing: true,
      isStatusClean: true,
      statusBehindCount: 0,
    };

    const result = getPullBtnStatus(params);

    expect(result).toEqual({
      isDisabled: true,
      message: "Conflicts found. Please resolve them and pull again.",
    });
  });

  it("should handle edge case when isClean is false, isProtectedMode is true, behindCount is 0", () => {
    const params: GetPullButtonStatusParams = {
      isProtectedMode: true,
      isPullFailing: false,
      isStatusClean: false,
      statusBehindCount: 0,
    };

    const result = getPullBtnStatus(params);

    expect(result).toEqual({
      isDisabled: true,
      message:
        "No commits to pull. This branch is in sync with the remote repository",
    });
  });
});
