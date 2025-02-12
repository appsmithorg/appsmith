package com.appsmith.server.applications.git;

import com.appsmith.external.git.constants.ce.RefType;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.actioncollections.base.ActionCollectionService;
import com.appsmith.server.applications.base.ApplicationService;
import com.appsmith.server.constants.Entity;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.ActionCollection;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.Artifact;
import com.appsmith.server.domains.GitArtifactMetadata;
import com.appsmith.server.domains.NewAction;
import com.appsmith.server.domains.NewPage;
import com.appsmith.server.dtos.ApplicationJson;
import com.appsmith.server.dtos.ArtifactExchangeJson;
import com.appsmith.server.dtos.GitAuthDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.helpers.CollectionUtils;
import com.appsmith.server.helpers.CommonGitFileUtils;
import com.appsmith.server.helpers.GitPrivateRepoHelper;
import com.appsmith.server.helpers.GitUtils;
import com.appsmith.server.migrations.JsonSchemaVersions;
import com.appsmith.server.newactions.base.NewActionService;
import com.appsmith.server.newpages.base.NewPageService;
import com.appsmith.server.services.ApplicationPageService;
import com.appsmith.server.services.ce.GitArtifactHelperCE;
import com.appsmith.server.solutions.ApplicationPermission;
import lombok.NonNull;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import reactor.core.Exceptions;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.io.IOException;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class GitApplicationHelperCEImpl implements GitArtifactHelperCE<Application> {

    private final CommonGitFileUtils commonGitFileUtils;
    private final GitPrivateRepoHelper gitPrivateRepoHelper;

    private final ApplicationService applicationService;
    private final ApplicationPageService applicationPageService;
    private final ApplicationPermission applicationPermission;
    private final NewPageService newPageService;
    private final ActionCollectionService actionCollectionService;
    private final NewActionService newActionService;
    private final JsonSchemaVersions jsonSchemaVersions;

    @Override
    public AclPermission getArtifactReadPermission() {
        return applicationPermission.getReadPermission();
    }

    @Override
    public AclPermission getArtifactEditPermission() {
        return applicationPermission.getEditPermission();
    }

    @Override
    public AclPermission getArtifactGitConnectPermission() {
        return applicationPermission.getGitConnectPermission();
    }

    @Override
    public AclPermission getArtifactAutoCommitPermission() {
        return applicationPermission.getManageAutoCommitPermission();
    }

    @Override
    public AclPermission getArtifactManageProtectedBranchPermission() {
        return applicationPermission.getManageProtectedBranchPermission();
    }

    @Override
    public AclPermission getArtifactManageDefaultBranchPermission() {
        return applicationPermission.getManageDefaultBranchPermission();
    }

    @Override
    public AclPermission getWorkspaceArtifactCreationPermission() {
        return AclPermission.WORKSPACE_CREATE_APPLICATION;
    }

    @Override
    public Mono<Application> getArtifactById(String applicationId, AclPermission aclPermission) {
        return applicationService
                .findById(applicationId, aclPermission)
                .switchIfEmpty(Mono.error(new AppsmithException(
                        AppsmithError.ACL_NO_RESOURCE_FOUND, FieldName.APPLICATION, applicationId)));
    }

    @Override
    public Flux<Application> getAllArtifactByBaseId(String baseArtifactId, AclPermission aclPermission) {
        return applicationService.findAllApplicationsByBaseApplicationId(baseArtifactId, aclPermission);
    }

    @Override
    public Mono<Application> getArtifactByBaseIdAndBranchName(
            String baseArtifactId, String branchName, AclPermission aclPermission) {
        return applicationService.findByBranchNameAndBaseApplicationId(branchName, baseArtifactId, aclPermission);
    }

    @Override
    public Mono<GitAuthDTO> getSshKeys(String baseArtifactId) {
        return applicationService.getSshKey(baseArtifactId);
    }

    @Override
    public Mono<Application> createNewArtifactForCheckout(Artifact sourceArtifact, String branchName) {
        GitArtifactMetadata sourceBranchGitData = sourceArtifact.getGitArtifactMetadata();
        sourceBranchGitData.setRefName(branchName);
        sourceBranchGitData.setIsRepoPrivate(null);
        // Save new artifact in DB and update from the parent branch application
        sourceBranchGitData.setGitAuth(null);
        sourceBranchGitData.setLastCommittedAt(Instant.now());

        Application sourceApplication = (Application) sourceArtifact;
        sourceApplication.setId(null);
        sourceApplication.setPages(null);
        sourceApplication.setPublishedPages(null);
        sourceApplication.setEditModeThemeId(null);
        sourceApplication.setPublishedModeThemeId(null);
        sourceApplication.setGitApplicationMetadata(sourceBranchGitData);

        return applicationService.save(sourceApplication);
    }

    @Override
    public Mono<Application> saveArtifact(Artifact artifact) {
        return applicationService.save((Application) artifact);
    }

    @Override
    public Mono<Application> updateArtifactWithSchemaVersions(Artifact artifact) {

        // Update json schema versions so that we can detect if the next update was made by DB migration or
        // by the user
        Application update = new Application();

        // Reset migration related fields before commit to detect the updates correctly between the commits
        update.setClientSchemaVersion(jsonSchemaVersions.getClientVersion());
        update.setServerSchemaVersion(jsonSchemaVersions.getServerVersion());
        update.setIsManualUpdate(false);

        return applicationService.update(artifact.getId(), update);
    }

    @Override
    public Mono<Void> updateArtifactWithProtectedBranches(String baseArtifactId, List<String> branchNames) {
        return applicationService.updateProtectedBranches(baseArtifactId, branchNames);
    }

    @Override
    public Path getRepoSuffixPath(String workspaceId, String artifactId, String repoName, @NonNull String... args) {
        List<String> varargs = new ArrayList<>(List.of(artifactId, repoName));
        varargs.addAll(List.of(args));
        return Paths.get(workspaceId, varargs.toArray(new String[0]));
    }

    @Override
    public Mono<Application> isPrivateRepoLimitReached(Artifact artifact, boolean isClearCache) {

        return gitPrivateRepoHelper
                .isRepoLimitReached(artifact.getWorkspaceId(), isClearCache)
                .flatMap(isRepoLimitReached -> {
                    if (Boolean.FALSE.equals(isRepoLimitReached)) {
                        return Mono.just((Application) artifact);
                    }
                    throw new AppsmithException(AppsmithError.GIT_APPLICATION_LIMIT_ERROR);
                });
    }

    @Override
    public Mono<Application> publishArtifact(Artifact artifact, Boolean isPublishedManually) {
        Application application = (Application) artifact;
        return applicationPageService.publishWithoutPermissionChecks(application.getId(), isPublishedManually);
    }

    // TODO: scope for improvement
    @Override
    public Mono<Path> intialiseReadMe(Artifact artifact, Path readMePath, String originHeader) throws IOException {

        // find default page and initialize readme
        Application application = (Application) artifact;
        String basePageId = "";
        if (!application.getPages().isEmpty()) {
            basePageId = application.getPages().stream()
                    .filter(applicationPage -> applicationPage.getIsDefault().equals(Boolean.TRUE))
                    .toList()
                    .get(0)
                    .getId();
        }

        String viewModeUrl = Paths.get("/", Entity.APPLICATIONS, "/", artifact.getId(), Entity.PAGES, basePageId)
                .toString();

        String editModeUrl = Paths.get(viewModeUrl, "edit").toString();
        // Initialize the repo with readme file

        return commonGitFileUtils
                .initializeReadme(readMePath, originHeader + viewModeUrl, originHeader + editModeUrl)
                .onErrorMap(throwable -> {
                    log.error("Error while initialising git repo, {0}", throwable);
                    return new AppsmithException(
                            AppsmithError.GIT_FILE_SYSTEM_ERROR,
                            Exceptions.unwrap(throwable).getMessage());
                });
    }

    @Override
    public Flux<Application> deleteAllBranches(String baseArtifactId, List<String> branches) {
        AclPermission appEditPermission = getArtifactEditPermission();

        return Flux.fromIterable(branches)
                .flatMap(branchName -> getArtifactByBaseIdAndBranchName(baseArtifactId, branchName, appEditPermission))
                .flatMap(applicationPageService::deleteApplicationByResource);
    }

    @Override
    public Mono<Application> deleteArtifactByResource(Artifact artifact) {
        return applicationPageService.deleteApplicationByResource((Application) artifact);
    }

    /**
     *  Setting all the pages' default resources ids to itself in application object
     * @param baseArtifact default version of Application which was tried to connect to git
     */
    @Override
    public void resetAttributeInBaseArtifact(Artifact baseArtifact) {
        Application baseApplication = (Application) baseArtifact;

        if (!CollectionUtils.isNullOrEmpty(baseApplication.getPages())) {
            baseApplication.getPages().forEach(page -> page.setDefaultPageId(page.getId()));
        }

        if (!CollectionUtils.isNullOrEmpty(baseApplication.getPublishedPages())) {
            baseApplication.getPublishedPages().forEach(page -> page.setDefaultPageId(page.getId()));
        }
    }

    @Override
    public Mono<Application> disconnectEntitiesOfBaseArtifact(Artifact baseArtifact) {
        Application baseApplication = (Application) baseArtifact;

        // Update all the resources to replace base Ids with the resource Ids as branchName
        // will be deleted
        Flux<NewPage> newPageFlux = Flux.fromIterable(baseApplication.getPages())
                .flatMap(page -> newPageService.findById(page.getId(), null))
                .map(GitUtils::resetEntityReferences)
                .collectList()
                .flatMapMany(newPageService::saveAll)
                .cache();

        Flux<NewAction> newActionFlux = newPageFlux.flatMap(newPage -> newActionService
                .findByPageId(newPage.getId(), Optional.empty())
                .map(GitUtils::resetEntityReferences)
                .collectList()
                .flatMapMany(newActionService::saveAll));

        Flux<ActionCollection> actionCollectionFlux = newPageFlux.flatMap(newPage -> actionCollectionService
                .findByPageId(newPage.getId())
                .map(GitUtils::resetEntityReferences)
                .collectList()
                .flatMapMany(actionCollectionService::saveAll));

        return Flux.merge(actionCollectionFlux, newActionFlux).then(Mono.just(baseApplication));
    }

    @Override
    public Mono<Application> createArtifactForImport(String workspaceId, String repoName) {
        Application newApplication = getNewArtifact(workspaceId, repoName);
        return applicationPageService.createOrUpdateSuffixedApplication(newApplication, newApplication.getName(), 0);
    }

    @Override
    public Mono<Application> deleteArtifact(String artifactId) {
        return applicationPageService.deleteApplication(artifactId);
    }

    @Override
    public Boolean isContextInArtifactEmpty(ArtifactExchangeJson artifactExchangeJson) {
        return CollectionUtils.isNullOrEmpty(((ApplicationJson) artifactExchangeJson).getPageList());
    }

    @Override
    public Application getNewArtifact(String workspaceId, String repoName) {
        Application newApplication = new Application();
        newApplication.setName(repoName);
        newApplication.setWorkspaceId(workspaceId);
        newApplication.setGitApplicationMetadata(new GitArtifactMetadata());
        return newApplication;
    }

    @Override
    public Mono<Application> publishArtifactPostCommit(Artifact committedArtifact) {
        return publishArtifact(committedArtifact, true);
    }

    @Override
    public Mono<? extends Artifact> validateAndPublishArtifact(Artifact artifact, boolean publish) {
        return publishArtifact(artifact, publish);
    }

    @Override
    public Mono<Application> publishArtifactPostRefCreation(
            Artifact artifact, RefType refType, Boolean isPublishedManually) {
        // TODO: create publish for ref type creation.
        Application application = (Application) artifact;
        if (RefType.tag.equals(refType)) {
            return Mono.just(application);
        }

        return Mono.just(application);
    }
}
