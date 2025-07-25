package com.appsmith.server.testhelpers.git;

import com.appsmith.external.converters.ISOStringToInstantConverter;
import com.appsmith.external.git.handler.FSGitHandler;
import com.appsmith.git.constants.CommonConstants;
import com.appsmith.server.constants.ArtifactType;
import com.appsmith.server.dtos.ApplicationJson;
import com.appsmith.server.events.AutoCommitEvent;
import com.appsmith.server.git.resolver.GitArtifactHelperResolver;
import com.appsmith.server.helpers.CommonGitFileUtils;
import com.appsmith.server.services.GitArtifactHelper;
import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.eclipse.jgit.api.errors.GitAPIException;
import org.springframework.stereotype.Component;
import org.testcontainers.shaded.org.apache.commons.io.FileUtils;

import java.io.File;
import java.io.FileReader;
import java.io.IOException;
import java.net.URISyntaxException;
import java.net.URL;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.Instant;

@Slf4j
@Component
@RequiredArgsConstructor
public class GitFileSystemTestHelper {

    private final GitArtifactHelperResolver gitArtifactHelperResolver;
    private final FSGitHandler fsGitHandler;
    private final CommonGitFileUtils commonGitFileUtils;

    private final Gson gson = new GsonBuilder()
            .registerTypeAdapter(Instant.class, new ISOStringToInstantConverter())
            .create();

    public void setupGitRepository(
            String workspaceId,
            String applicationId,
            String branchName,
            String repoName,
            ApplicationJson applicationJson)
            throws GitAPIException, IOException {

        GitArtifactHelper<?> gitArtifactHelper =
                gitArtifactHelperResolver.getArtifactHelper(applicationJson.getArtifactJsonType());
        Path artifactRepoSuffixPath = gitArtifactHelper.getRepoSuffixPath(workspaceId, applicationId, repoName);

        Path gitCompletePath = fsGitHandler.createRepoPath(artifactRepoSuffixPath);
        String metadataFileName = CommonConstants.METADATA + CommonConstants.JSON_EXTENSION;

        // Delete the repository if it already exists,
        // this is to avoid left over repositories from older tests.
        deleteWorkspaceDirectory(workspaceId);

        // create a new repository
        log.debug("Setting up Git repository at path: {}", gitCompletePath);
        fsGitHandler.createNewRepository(gitCompletePath);
        File file = gitCompletePath.resolve(metadataFileName).toFile();
        file.createNewFile();

        // committing initially to avoid ref-head error
        fsGitHandler
                .commitArtifact(artifactRepoSuffixPath, "commit message", "user", "user@domain.xy", true, false)
                .block();

        // checkout to the new branch
        fsGitHandler
                .createAndCheckoutToBranch(artifactRepoSuffixPath, branchName)
                .block();
        commitArtifact(workspaceId, applicationId, branchName, repoName, applicationJson, "commit message two");
    }

    public void commitArtifact(
            String workspaceId,
            String applicationId,
            String branchName,
            String repoName,
            ApplicationJson applicationJson,
            String commitMessage)
            throws GitAPIException, IOException {
        Path suffix = Paths.get(workspaceId, applicationId, repoName);
        // saving the files into the git repository from application json
        // The files would later be saved in this git repository from resources section instead of applicationJson

        GitArtifactHelper<?> gitArtifactHelper = gitArtifactHelperResolver.getArtifactHelper(ArtifactType.APPLICATION);
        Path artifactRepoSuffixPath = gitArtifactHelper.getRepoSuffixPath(workspaceId, applicationId, repoName);
        commonGitFileUtils
                .saveArtifactToLocalRepoNew(artifactRepoSuffixPath, applicationJson, branchName)
                .block();

        // commit the application
        fsGitHandler
                .commitArtifact(suffix, commitMessage, "user", "user@domain.xy", true, false)
                .block();
    }

    public void setupGitRepository(AutoCommitEvent autoCommitEvent, ApplicationJson applicationJson)
            throws GitAPIException, IOException {
        String workspaceId = autoCommitEvent.getWorkspaceId();
        String applicationId = autoCommitEvent.getApplicationId();
        String branchName = autoCommitEvent.getBranchName();
        String repoName = autoCommitEvent.getRepoName();

        setupGitRepository(workspaceId, applicationId, branchName, repoName, applicationJson);
    }

    public void deleteWorkspaceDirectory(String workspaceId) {
        try {
            Path repoPath = fsGitHandler.createRepoPath(Paths.get(workspaceId));
            FileUtils.deleteDirectory(repoPath.toFile());
        } catch (IOException ioException) {
            log.info("unable to delete the workspace with id : {}", workspaceId);
        }
    }

    public ApplicationJson getApplicationJson(URL fileUrl) throws URISyntaxException, IOException {
        File file = new File(fileUrl.toURI());
        FileReader fileReader = new FileReader(file);
        return gson.fromJson(fileReader, ApplicationJson.class);
    }
}
