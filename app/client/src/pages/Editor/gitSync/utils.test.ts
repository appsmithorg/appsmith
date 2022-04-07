import { getIsStartingWithRemoteBranches, isValidGitRemoteUrl } from "./utils";

const validUrls = [
  "git@github.com:user/project.git",
  "git://a@b:c/d.git",
  "git@192.168.101.127:user/project.git",
  "ssh://user@host.xz:port/path/to/repo.git",
  "ssh://user@host.xz/path/to/repo.git",
  "ssh://host.xz:port/path/to/repo.git",
  "ssh://host.xz/path/to/repo.git",
  "ssh://user@host.xz/path/to/repo.git",
  "ssh://host.xz/path/to/repo.git",
  "ssh://user@host.xz/~user/path/to/repo.git",
  "ssh://host.xz/~user/path/to/repo.git",
  "ssh://user@host.xz/~/path/to/repo.git",
  "ssh://host.xz/~/path/to/repo.git",
];

const invalidUrls = [
  "gitclonegit://a@b:c/d.git",
  "https://github.com/user/project.git",
  "http://github.com/user/project.git",
  "https://192.168.101.127/user/project.git",
  "http://192.168.101.127/user/project.git",
  "ssh://user@host.xz:port/path/to/repo.git/",
  "ssh://user@host.xz/path/to/repo.git/",
  "ssh://host.xz:port/path/to/repo.git/",
  "ssh://host.xz/path/to/repo.git/",
  "ssh://user@host.xz/path/to/repo.git/",
  "ssh://host.xz/path/to/repo.git/",
  "ssh://user@host.xz/~user/path/to/repo.git/",
  "ssh://host.xz/~user/path/to/repo.git/",
  "git://host.xz/path/to/repo.git/",
  "git://host.xz/~user/path/to/repo.git/",
  "http://host.xz/path/to/repo.git/",
  "https://host.xz/path/to/repo.git/",
  "/path/to/repo.git/",
  "path/to/repo.git/",
  "~/path/to/repo.git",
  "file:///path/to/repo.git/",
  "file://~/path/to/repo.git/",
  "user@host.xz:/path/to/repo.git/",
  "host.xz:/path/to/repo.git/",
  "user@host.xz:~user/path/to/repo.git/",
  "host.xz:~user/path/to/repo.git/",
  "user@host.xz:path/to/repo.git",
  "host.xz:path/to/repo.git",
  "rsync://host.xz/path/to/repo.git/",
];

describe("gitSync utils", () => {
  describe("getIsStartingWithRemoteBranches", function() {
    it("returns true when only remote starts with origin/", () => {
      const actual = getIsStartingWithRemoteBranches(
        "whatever",
        "origin/whateverelse",
      );
      const expected = true;
      expect(actual).toEqual(expected);
    });
  });

  describe("isValidGitRemoteUrl returns true for valid urls", () => {
    validUrls.forEach((validUrl: string) => {
      it(`${validUrl} is a valid git remote URL`, () => {
        const actual = isValidGitRemoteUrl(validUrl);
        const expected = true;
        expect(actual).toEqual(expected);
      });
    });
  });

  describe("isValidGitRemoteUrl returns false for invalid urls", () => {
    invalidUrls.forEach((invalidUrl: string) => {
      it(`${invalidUrl} is a valid git remote URL`, () => {
        const actual = isValidGitRemoteUrl(invalidUrl);
        const expected = false;
        expect(actual).toEqual(expected);
      });
    });
  });
});
