package com.appsmith.server.helpers;


import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import org.eclipse.jgit.util.StringUtils;

import java.io.IOException;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class GitUtils {

    /**
     * Sample repo urls :
     * git@gitPlatform.com:user/repoName.git
     * https://gitPlatform.com/user/repoName
     *
     * @param sshUrl ssh url of repo
     * @return https url supported by curl command extracted from ssh repo url
     */
    public static String convertSshUrlToBrowserSupportedUrl(String sshUrl) {
        if (StringUtils.isEmptyOrNull(sshUrl)) {
            throw new AppsmithException(AppsmithError.INVALID_PARAMETER, "ssh url");
        }
        return sshUrl
                .replaceFirst("git@", "https://")
                .replaceFirst("\\.com:", ".com/")
                .replaceFirst("\\.org:", ".org/")
                .replaceFirst("\\.git", "");
    }

    /**
     * Sample repo urls :
     * git@github.com:username/reponame.git
     * ssh://git@bitbucket.org/<workspace_ID>/<repo_name>.git
     * @param remoteUrl ssh url of repo
     * @return repo name extracted from repo url
     */
    public static String getRepoName(String remoteUrl) {
        // Pattern to match all words in the text
        final Matcher matcher = Pattern.compile("([^/]*).git$").matcher(remoteUrl);
        if (matcher.find()) {
            return matcher.group(1);
        }
        throw new AppsmithException(AppsmithError.INVALID_GIT_CONFIGURATION, "Remote URL is incorrect! Can you " +
                "please provide as per standard format => git@github.com:username/reponame.git");
    }

    /**
     * This method checks if the provided git-repo is public or private by checking the response from the get request
     * if we get 200 or 202 then repo is public otherwise it's private
     *
     * @param remoteHttpsUrl remote url in https format
     * @return if the repo is public
     * @throws IOException exception thrown during openConnection
     */
    public static boolean isRepoPrivate(String remoteHttpsUrl) throws IOException {
        URL url = new URL(remoteHttpsUrl);
        HttpURLConnection huc = (HttpURLConnection) url.openConnection();
        int responseCode = huc.getResponseCode();

        return !(HttpURLConnection.HTTP_OK == responseCode || HttpURLConnection.HTTP_ACCEPTED == responseCode);
    }

    /**
     * Sample repo urls :
     * git@gitPlatform.com:user/repoName.git
     * gitPlatform
     *
     * @param sshUrl ssh url of repo
     * @return git hosting provider
     */
    public static String getGitProviderName(String sshUrl) {
        if(StringUtils.isEmptyOrNull(sshUrl)) {
            return "";
        }
        return sshUrl.split("\\.")[0]
                .replaceFirst("git@", "");
    }
}
