package com.appsmith.server.helpers;


import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.util.WebClientUtils;
import org.eclipse.jgit.util.StringUtils;
import reactor.core.publisher.Mono;
import reactor.netty.http.client.HttpClientRequest;

import java.io.IOException;
import java.time.Duration;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class GitUtils {

    /**
     * Sample repo urls :
     * git@example.com:user/repoName.git
     * ssh://git@example.org/<workspace_ID>/<repo_name>.git
     * https://example.com/user/repoName
     *
     * @param sshUrl ssh url of repo
     * @return https url supported by curl command extracted from ssh repo url
     */
    public static String convertSshUrlToBrowserSupportedUrl(String sshUrl) {
        if (StringUtils.isEmptyOrNull(sshUrl)) {
            throw new AppsmithException(AppsmithError.INVALID_PARAMETER, "ssh url");
        }
        return sshUrl
                .replaceFirst(".*git@", "https://")
                .replaceFirst("(\\.[a-z]*):", "$1/")
                .replaceFirst("\\.git$", "");
    }

    /**
     * Sample repo urls :
     * git@example.com:username/reponame.git
     * ssh://git@example.org/<workspace_ID>/<repo_name>.git
     * @param remoteUrl ssh url of repo
     * @return repo name extracted from repo url
     */
    public static String getRepoName(String remoteUrl) {
        // Pattern to match git SSH URL
        final Matcher matcher = Pattern.compile("((git|ssh|http(s)?)|(git@[\\w\\-\\.]+))(:(\\/\\/)?)([\\w.@:/\\-~]+)(\\.git|)(\\/)?").matcher(remoteUrl);
        if (matcher.find()) {
            // To trim the postfix and prefix
            return matcher.group(7)
                    .replaceFirst("\\.git$", "")
                    .replaceFirst("^(.*[\\\\\\/])", "");
        }
        throw new AppsmithException(AppsmithError.INVALID_GIT_CONFIGURATION, "Remote URL is incorrect, " +
                "please add a URL in standard format. Example: git@example.com:username/reponame.git");
    }

    /**
     * This method checks if the provided git-repo is public or private by checking the response from the get request
     * if we get 200 or 202 then repo is public otherwise it's private
     *
     * @param remoteHttpsUrl remote url in https format
     * @return if the repo is public
     * @throws IOException exception thrown during openConnection
     */
    public static Mono<Boolean> isRepoPrivate(String remoteHttpsUrl) {
        return WebClientUtils
                .create(remoteHttpsUrl)
                .get()
                .httpRequest(httpRequest -> {
                    HttpClientRequest reactorRequest = httpRequest.getNativeRequest();
                    reactorRequest.responseTimeout(Duration.ofSeconds(2));
                })
                .exchange()
                .flatMap(response -> {
                    if (response.statusCode().is2xxSuccessful()) {
                        return Mono.just(Boolean.FALSE);
                    } else {
                        return Mono.just(Boolean.TRUE);
                    }
                })
                .onErrorResume(throwable -> Mono.just(Boolean.TRUE));
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
