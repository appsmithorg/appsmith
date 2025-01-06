package com.appsmith.server.helpers;

import com.appsmith.server.domains.GitArtifactMetadata;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.util.WebClientUtils;
import net.minidev.json.JSONObject;
import org.eclipse.jgit.util.StringUtils;
import reactor.core.publisher.Mono;
import reactor.netty.http.client.HttpClientRequest;

import java.io.IOException;
import java.time.Duration;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class GitUtils {

    public static final Duration RETRY_DELAY = Duration.ofSeconds(1);
    public static final Integer MAX_RETRIES = 20;

    /**
     * Pattern for validating the ssh address if that starts with a scheme
     * Should start with ssh://
     * may or may not have a username : e.g. ssh://domain.xy:/path/path.git
     * username can start with any small alphabet or a _ underscore
     * the RFC host name should have regex : ((?!-)[A-Za-z0-9-]{1,63}(?<!-)\\.)+[A-Za-z0-9-]{1,63}\\.[A-Za-z]{2,6},
     * however due to already existing leniency
     * hostname can have all alphanumerics, -, and .  e.g. ssh://_ab-xy@ab-12.ab:/v3/newJet/ai/zilla.git
     * the port number could be not present as well. e.g. ssh://_ab-xy@domain.com:/v3/newJet/ai/zilla
     */
    public static final Pattern URL_PATTERN_WITH_SCHEME =
            Pattern.compile("^ssh://([a-z_][\\w-]+@)?(?<host>[\\w-.]+)(:(?<port>\\d*))?/+(?<path>.+?)(\\.git)?$");

    /**
     * Pattern for validating the ssh address if it strictly doesn't start with a scheme
     * username can start with any small alphabet or a _ underscore
     * hostname can have all alphanumerics, -, and .  e.g. ssh://_ab-xy@ab-12.ab:/v3/newJet/ai/zilla.git
     * the port number could be not present as well. e.g. ssh://_ab-xy@domain.com:/v3/newJet/ai/zilla
     */
    public static final Pattern URL_PATTERN_WITHOUT_SCHEME =
            Pattern.compile("^[a-z_][\\w-]+@(?<host>[\\w-.]+):/*(?<path>.+?)(\\.git)?$");

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

        Matcher match = URL_PATTERN_WITH_SCHEME.matcher(sshUrl);
        if (!match.matches()) {
            match = URL_PATTERN_WITHOUT_SCHEME.matcher(sshUrl);
        }

        if (!match.matches()) {
            throw new AppsmithException(
                    AppsmithError.INVALID_GIT_CONFIGURATION,
                    "Remote URL is incorrect. Please add a URL in standard format. Example: git@example.com:username/reponame.git");
        }

        return "https://" + match.group("host") + "/" + match.group("path");
    }

    /**
     * Sample repo urls :
     * git@example.com:username/reponame.git
     * ssh://git@example.org/<workspace_ID>/<repo_name>.git
     *
     * @param remoteUrl ssh url of repo
     * @return repo name extracted from repo url
     */
    public static String getRepoName(String remoteUrl) {
        // Pattern to match git SSH URL
        final Matcher matcher = Pattern.compile(
                        "((git|ssh)|([\\w\\-\\.]+@[\\w\\-\\.]+))(:(\\/\\/)?)([\\w.@:\\/\\-~\\(\\)\\%]+)(\\.git|)(\\/)?")
                .matcher(remoteUrl);
        if (matcher.find()) {
            // To trim the postfix and prefix
            return matcher.group(6).replaceFirst("\\.git$", "").replaceFirst("^(.*[\\\\\\/])", "");
        }
        throw new AppsmithException(
                AppsmithError.INVALID_GIT_CONFIGURATION,
                "Remote URL is incorrect. "
                        + "Please add a URL in standard format. Example: git@example.com:username/reponame.git");
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
        return WebClientUtils.create(remoteHttpsUrl)
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
        if (StringUtils.isEmptyOrNull(sshUrl)) {
            return "";
        }
        return sshUrl.split("\\.")[0].replaceFirst("git@", "");
    }

    public static String getDefaultBranchName(GitArtifactMetadata gitArtifactMetadata) {
        return StringUtils.isEmptyOrNull(gitArtifactMetadata.getDefaultBranchName())
                ? gitArtifactMetadata.getRefName()
                : gitArtifactMetadata.getDefaultBranchName();
    }

    /**
     * This method checks if the artifact is connected to git and is the default branched.
     *
     * @param gitArtifactMetadata   gitArtifactMetadata to be checked
     * @return              true if the artifact is default branched, false otherwise
     */
    public static boolean isDefaultBranchedArtifact(GitArtifactMetadata gitArtifactMetadata) {
        return isArtifactConnectedToGit(gitArtifactMetadata)
                && !StringUtils.isEmptyOrNull(gitArtifactMetadata.getRefName())
                && gitArtifactMetadata.getRefName().equals(gitArtifactMetadata.getDefaultBranchName());
    }

    /**
     * This method checks if the artifact is connected to Git or not.
     * @param gitArtifactMetadata   gitArtifactMetadata to be checked
     * @return              true if the artifact is connected to Git, false otherwise
     */
    public static boolean isArtifactConnectedToGit(GitArtifactMetadata gitArtifactMetadata) {
        return gitArtifactMetadata != null
                && !StringUtils.isEmptyOrNull(gitArtifactMetadata.getDefaultArtifactId())
                && !StringUtils.isEmptyOrNull(gitArtifactMetadata.getRemoteUrl());
    }

    public static boolean isMigrationRequired(JSONObject layoutDsl, Integer latestDslVersion) {
        boolean isMigrationRequired = true;
        String versionKey = "version";
        if (layoutDsl.containsKey(versionKey)) {
            int currentDslVersion = layoutDsl.getAsNumber(versionKey).intValue();
            if (currentDslVersion >= latestDslVersion) {
                isMigrationRequired = false;
            }
        }
        return isMigrationRequired;
    }

    public static boolean isMigrationRequired(org.json.JSONObject layoutDsl, Integer latestDslVersion) {
        boolean isMigrationRequired = true;
        String versionKey = "version";
        if (layoutDsl.has(versionKey)) {
            int currentDslVersion = layoutDsl.getInt(versionKey);
            if (currentDslVersion >= latestDslVersion) {
                isMigrationRequired = false;
            }
        }
        return isMigrationRequired;
    }

    public static boolean isAutoCommitEnabled(GitArtifactMetadata gitArtifactMetadata) {
        return gitArtifactMetadata.getAutoCommitConfig() == null
                || gitArtifactMetadata.getAutoCommitConfig().getEnabled();
    }
}
