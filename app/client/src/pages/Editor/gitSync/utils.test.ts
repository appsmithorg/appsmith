import {
  changeInfoSinceLastCommit,
  getIsStartingWithRemoteBranches,
  isLocalBranch,
  isRemoteBranch,
  isValidGitRemoteUrl,
  removeSpecialChars,
} from "./utils";
import { ApplicationVersion } from "actions/applicationActions";

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
  "git@ssh.dev.azure.com:v3/something/other/thing",
  "git@ssh.dev.azure.com:v3/something/other/thing.git",
  "git@ssh.dev.azure.com:v3/something/other/(thing).git",
  "git@ssh.dev.azure.com:v3/(((something)/(other)/(thing).git",
  "git@abcd.org:org__v3/(((something)/(other)/(thing).git",
  "git@gitlab-abcd.test.org:org__org/repoName.git",
  "git@gitlab__abcd.test.org:org__org/repoName.git",
];

const invalidUrls = [
  "git@ssh.dev.azure.(com):v3/(((something)/(other)/(thing).git",
  "git@ssh.dev.azure.com:v3/something/other/thing/",
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

    it("returns false if param:local starts with origin/", () => {
      const actual = getIsStartingWithRemoteBranches(
        "origin/a",
        "origin/whateverelse",
      );
      const expected = false;
      expect(actual).toEqual(expected);
    });

    it("returns empty string if param:local is empty string", () => {
      const actual = getIsStartingWithRemoteBranches("a", "");
      const expected = "";
      expect(actual).toEqual(expected);
    });

    it("returns empty string if param:remote is empty string", () => {
      const actual = getIsStartingWithRemoteBranches("", "");
      const expected = "";
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

  describe("isRemoteBranch", () => {
    it("returns true for branches that start with origin/", () => {
      const branches = ["origin/", "origin/_", "origin/a", "origin/origin"];
      const actual = branches.every(isRemoteBranch);
      const expected = true;
      expect(actual).toEqual(expected);
    });

    it("returns false for branches that don't start with origin/", () => {
      const branches = [
        "origin",
        "original/",
        "oriign/_",
        "main/",
        "upstream/origin",
        "develop/",
        "release/",
        "master/",
      ];
      const actual = branches.every(isRemoteBranch);
      const expected = false;
      expect(actual).toEqual(expected);
    });
  });

  describe("isLocalBranch", () => {
    it("returns false for branches that start with origin/", () => {
      const branches = ["origin/", "origin/_", "origin/a", "origin/origin"];
      const actual = branches.every(isLocalBranch);
      const expected = false;
      expect(actual).toEqual(expected);
    });

    it("returns true for branches that don't start with origin/", () => {
      const branches = [
        "origin",
        "original/",
        "oriign/_",
        "main/",
        "upstream/origin",
        "develop/",
        "release/",
        "master/",
      ];
      const actual = branches.every(isLocalBranch);
      const expected = true;
      expect(actual).toEqual(expected);
    });
  });

  describe("removeSpecialCharacters", () => {
    it("replaces special characters except / and - with _", () => {
      const inputs = [
        "abc_def",
        "abc-def",
        "abc*def",
        "abc/def",
        "abc&def",
        "abc%def",
        "abc#def",
        "abc@def",
        "abc!def",
        "abc,def",
        "abc<def",
        "abc>def",
        "abc?def",
        "abc.def",
        "abc;def",
        "abc(def",
      ];

      const expected = [
        "abc_def",
        "abc-def",
        "abc_def",
        "abc/def",
        "abc_def",
        "abc_def",
        "abc_def",
        "abc_def",
        "abc_def",
        "abc_def",
        "abc_def",
        "abc_def",
        "abc_def",
        "abc_def",
        "abc_def",
        "abc_def",
      ];

      inputs.forEach((input, index) => {
        const result = removeSpecialChars(input);
        expect(result).toStrictEqual(expected[index]);
      });
    });
  });
  describe("changeInfoSinceLastCommit", () => {
    it("returns default data", () => {
      const applicationData = {
        appIsExample: false,
        applicationVersion: ApplicationVersion.DEFAULT,
        defaultPageId: "",
        slug: "",
        id: "",
        isAutoUpdate: false,
        isManualUpdate: false,
        name: "",
        workspaceId: "",
        pages: [],
      };
      const actual = changeInfoSinceLastCommit(applicationData);
      const expected = {
        changeReasonText: "Changes since last deployment",
        isAutoUpdate: false,
        isManualUpdate: false,
      };
      expect(actual).toEqual(expected);
    });
    it("returns migration change only data", () => {
      const applicationData = {
        appIsExample: false,
        applicationVersion: ApplicationVersion.DEFAULT,
        defaultPageId: "",
        id: "",
        slug: "",
        isAutoUpdate: true,
        isManualUpdate: false,
        name: "",
        workspaceId: "",
        pages: [],
      };
      const actual = changeInfoSinceLastCommit(applicationData);
      const expected = {
        changeReasonText: "Changes since last deployment",
        isAutoUpdate: true,
        isManualUpdate: false,
      };
      expect(actual).toEqual(expected);
    });
    it("returns migration and user change data", () => {
      const applicationData = {
        appIsExample: false,
        applicationVersion: ApplicationVersion.DEFAULT,
        defaultPageId: "",
        id: "",
        slug: "",
        isAutoUpdate: true,
        isManualUpdate: true,
        name: "",
        workspaceId: "",
        pages: [],
      };
      const actual = changeInfoSinceLastCommit(applicationData);
      const expected = {
        changeReasonText: "Changes since last deployment",
        isAutoUpdate: true,
        isManualUpdate: true,
      };
      expect(actual).toEqual(expected);
    });
    it("returns user changes only data", () => {
      const applicationData = {
        appIsExample: false,
        applicationVersion: ApplicationVersion.DEFAULT,
        defaultPageId: "",
        id: "",
        slug: "",
        isAutoUpdate: false,
        isManualUpdate: true,
        name: "",
        workspaceId: "",
        pages: [],
      };
      const actual = changeInfoSinceLastCommit(applicationData);
      const expected = {
        changeReasonText: "Changes since last deployment",
        isAutoUpdate: false,
        isManualUpdate: true,
      };
      expect(actual).toEqual(expected);
    });
  });
});
