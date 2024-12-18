const GIT_REMOTE_URL_PATTERN =
  /^((git|ssh)|([\w\-\.]+@[\w\-\.]+))(:(\/\/)?)([\w\.@\:\/\-~\(\)%]+)[^\/]$/im;

const gitRemoteUrlRegExp = new RegExp(GIT_REMOTE_URL_PATTERN);

/**
 * isValidGitRemoteUrl: returns true if a url follows valid SSH/git url scheme, see GIT_REMOTE_URL_PATTERN
 * @param url {string} remote url input
 * @returns {boolean} true if valid remote url, false otherwise
 */
export const isValidGitRemoteUrl = (url: string) =>
  gitRemoteUrlRegExp.test(url);
