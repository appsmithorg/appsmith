import { getPullBtnStatus, capitalizeFirstLetter } from "./helpers";

describe("getPullBtnStatus", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return disabled with message "No commits to pull" when behindCount is 0', () => {
    const gitStatus: Record<string, unknown> = {
      behindCount: 0,
      isClean: true,
    };
    const pullFailed = false;
    const isProtected = false;

    const result = getPullBtnStatus(gitStatus, pullFailed, isProtected);

    expect(result).toEqual({
      disabled: true,
      message:
        "No commits to pull. This branch is in sync with the remote repository",
    });
  });

  it('should return disabled with message "Cannot pull with local uncommitted changes" when isClean is false and isProtected is false', () => {
    const gitStatus: Record<string, unknown> = {
      behindCount: 5,
      isClean: false,
    };
    const pullFailed = false;
    const isProtected = false;

    const result = getPullBtnStatus(gitStatus, pullFailed, isProtected);

    expect(result).toEqual({
      disabled: true,
      message:
        "You have uncommitted changes. Please commit or discard before pulling the remote changes.",
    });
  });

  it('should return enabled with message "Pull changes" when isClean is false, isProtected is true, and behindCount > 0', () => {
    const gitStatus: Record<string, unknown> = {
      behindCount: 3,
      isClean: false,
    };
    const pullFailed = false;
    const isProtected = true;

    const result = getPullBtnStatus(gitStatus, pullFailed, isProtected);

    expect(result).toEqual({
      disabled: false,
      message: "Pull changes",
    });
  });

  it('should return message "Conflicts found" when pullFailed is true', () => {
    const gitStatus: Record<string, unknown> = {
      behindCount: 2,
      isClean: true,
    };
    const pullFailed = true;
    const isProtected = false;

    const result = getPullBtnStatus(gitStatus, pullFailed, isProtected);

    expect(result).toEqual({
      disabled: false,
      message: "Conflicts found. Please resolve them and pull again.",
    });
  });

  it('should return enabled with message "Pull changes" when behindCount > 0 and no other conditions met', () => {
    const gitStatus: Record<string, unknown> = {
      behindCount: 1,
      isClean: true,
    };
    const pullFailed = false;
    const isProtected = false;

    const result = getPullBtnStatus(gitStatus, pullFailed, isProtected);

    expect(result).toEqual({
      disabled: false,
      message: "Pull changes",
    });
  });

  it('should return disabled with message "No commits to pull" when behindCount is 0 regardless of isClean and isProtected', () => {
    const gitStatus: Record<string, unknown> = {
      behindCount: 0,
      isClean: false,
    };
    const pullFailed = false;
    const isProtected = true;

    const result = getPullBtnStatus(gitStatus, pullFailed, isProtected);

    expect(result).toEqual({
      disabled: true,
      message:
        "No commits to pull. This branch is in sync with the remote repository",
    });
  });

  it("should prioritize pullFailed over other conditions", () => {
    const gitStatus: Record<string, unknown> = {
      behindCount: 0,
      isClean: true,
    };
    const pullFailed = true;
    const isProtected = false;

    const result = getPullBtnStatus(gitStatus, pullFailed, isProtected);

    expect(result).toEqual({
      disabled: true,
      message: "Conflicts found. Please resolve them and pull again.",
    });
  });

  it("should handle edge case when isClean is false, isProtected is true, behindCount is 0", () => {
    const gitStatus: Record<string, unknown> = {
      behindCount: 0,
      isClean: false,
    };
    const pullFailed = false;
    const isProtected = true;

    const result = getPullBtnStatus(gitStatus, pullFailed, isProtected);

    expect(result).toEqual({
      disabled: true,
      message:
        "No commits to pull. This branch is in sync with the remote repository",
    });
  });
});

describe("capitalizeFirstLetter", () => {
  it("should capitalize the first letter of a lowercase word", () => {
    const result = capitalizeFirstLetter("hello");

    expect(result).toBe("Hello");
  });

  it("should capitalize the first letter of an uppercase word", () => {
    const result = capitalizeFirstLetter("WORLD");

    expect(result).toBe("World");
  });

  it("should handle empty string", () => {
    const result = capitalizeFirstLetter("");

    expect(result).toBe("");
  });

  it("should handle single character", () => {
    const result = capitalizeFirstLetter("a");

    expect(result).toBe("A");
  });

  it("should handle strings with spaces", () => {
    const result = capitalizeFirstLetter("multiple words here");

    expect(result).toBe("Multiple words here");
  });

  it("should handle undefined input", () => {
    // The function provides a default value of " " when input is undefined
    // So we expect the output to be a single space with capitalized first letter
    const result = capitalizeFirstLetter();

    expect(result).toBe(" ");
  });

  it("should handle strings with special characters", () => {
    const result = capitalizeFirstLetter("123abc");

    expect(result).toBe("123abc");
  });

  it("should not modify strings where the first character is not a letter", () => {
    const result = capitalizeFirstLetter("!test");

    expect(result).toBe("!test");
  });
});
