package com.appsmith.server.applications.git;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.actioncollections.base.ActionCollectionService;
import com.appsmith.server.applications.base.ApplicationService;
import com.appsmith.server.constants.Entity;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.ActionCollection;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.Artifact;
import com.appsmith.server.domains.NewAction;
import com.appsmith.server.domains.NewPage;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.helpers.CollectionUtils;
import com.appsmith.server.helpers.CommonGitFileUtils;
import com.appsmith.server.helpers.GitPrivateRepoHelper;
import com.appsmith.server.helpers.ResponseUtils;
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
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static com.appsmith.server.helpers.DefaultResourcesUtils.createDefaultIdsOrUpdateWithGivenResourceIds;

@Slf4j
@Service
@RequiredArgsConstructor
public class GitApplicationHelperCEImpl implements GitArtifactHelperCE<Application> {

    private final CommonGitFileUtils gitFileUtils;
    private final GitPrivateRepoHelper gitPrivateRepoHelper;

    private final ApplicationService applicationService;
    private final ApplicationPageService applicationPageService;
    private final ApplicationPermission applicationPermission;
    private final NewPageService newPageService;
    private final ActionCollectionService actionCollectionService;
    private final NewActionService newActionService;
    private final ResponseUtils responseUtils;

    @Override
    public AclPermission getArtifactEditPermission() {
        return applicationPermission.getEditPermission();
    }

    @Override
    public AclPermission getArtifactGitConnectPermission() {
        return applicationPermission.getGitConnectPermission();
    }

    @Override
    public Mono<Application> getArtifactById(String applicationId, AclPermission aclPermission) {
        return applicationService
                .findById(applicationId, aclPermission)
                .switchIfEmpty(Mono.error(new AppsmithException(
                        AppsmithError.ACL_NO_RESOURCE_FOUND, FieldName.APPLICATION, applicationId)));
    }

    @Override
    public Mono<Application> getArtifactByDefaultIdAndBranchName(
            String defaultArtifactId, String branchName, AclPermission aclPermission) {
        return applicationService.findByBranchNameAndDefaultApplicationId(branchName, defaultArtifactId, aclPermission);
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
        update.setClientSchemaVersion(JsonSchemaVersions.clientVersion);
        update.setServerSchemaVersion(JsonSchemaVersions.serverVersion);
        update.setIsManualUpdate(false);

        return applicationService.update(artifact.getId(), update);
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
    public Mono<Application> publishArtifact(Artifact artifact) {
        Application application = (Application) artifact;
        return applicationPageService.publish(application.getId(), true).then(Mono.just(application));
    }

    // TODO: scope for improvement
    @Override
    public Mono<Path> intialiseReadMe(Artifact artifact, Path readMePath, String originHeader) throws IOException {

        // find default page and initialize readme
        Application application = (Application) artifact;
        String defaultPageId = "";
        if (!application.getPages().isEmpty()) {
            defaultPageId = application.getPages().stream()
                    .filter(applicationPage -> applicationPage.getIsDefault().equals(Boolean.TRUE))
                    .toList()
                    .get(0)
                    .getId();
        }

        String viewModeUrl = Paths.get("/", Entity.APPLICATIONS, "/", artifact.getId(), Entity.PAGES, defaultPageId)
                .toString();

        String editModeUrl = Paths.get(viewModeUrl, "edit").toString();
        // Initialize the repo with readme file

        return gitFileUtils
                .initializeReadme(readMePath, originHeader + viewModeUrl, originHeader + editModeUrl)
                .onErrorMap(throwable -> {
                    log.error("Error while initialising git repo, {0}", throwable);
                    return new AppsmithException(
                            AppsmithError.GIT_FILE_SYSTEM_ERROR,
                            Exceptions.unwrap(throwable).getMessage());
                });
    }

    @Override
    public Flux<Application> deleteAllBranches(String defaultArtifactId, List<String> branches) {
        AclPermission appEditPermission = getArtifactEditPermission();

        return Flux.fromIterable(branches)
                .flatMap(branchName ->
                        getArtifactByDefaultIdAndBranchName(defaultArtifactId, branchName, appEditPermission))
                .flatMap(applicationPageService::deleteApplicationByResource);
    }

    /**
     *  Setting all the pages' default resources ids to itself in application object
     * @param defaultArtifact default version of Application which was tried to connect to git
     */
    @Override
    public void resetAttributeInDefaultArtifact(Artifact defaultArtifact) {
        Application defaultApplication = (Application) defaultArtifact;

        if (!CollectionUtils.isNullOrEmpty(defaultApplication.getPages())) {
            defaultApplication.getPages().forEach(page -> page.setDefaultPageId(page.getId()));
        }

        if (!CollectionUtils.isNullOrEmpty(defaultApplication.getPublishedPages())) {
            defaultApplication.getPublishedPages().forEach(page -> page.setDefaultPageId(page.getId()));
        }
    }

    @Override
    public Mono<Application> disconnectEntitiesOfDefaultArtifact(Artifact defaultArtifact) {
        Application defaultApplication = (Application) defaultArtifact;

        // Update all the resources to replace defaultResource Ids with the resource Ids as branchName
        // will be deleted
        Flux<NewPage> newPageFlux = Flux.fromIterable(defaultApplication.getPages())
                .flatMap(page -> newPageService.findById(page.getId(), Optional.empty()))
                .map(newPage -> {
                    newPage.setDefaultResources(null);
                    return createDefaultIdsOrUpdateWithGivenResourceIds(newPage, null);
                })
                .collectList()
                .flatMapMany(newPageService::saveAll)
                .cache();

        Flux<NewAction> newActionFlux = newPageFlux.flatMap(newPage -> {
            return newActionService
                    .findByPageId(newPage.getId(), Optional.empty())
                    .map(newAction -> {
                        newAction.setDefaultResources(null);
                        if (newAction.getUnpublishedAction() != null) {
                            newAction.getUnpublishedAction().setDefaultResources(null);
                        }
                        if (newAction.getPublishedAction() != null) {
                            newAction.getPublishedAction().setDefaultResources(null);
                        }
                        return createDefaultIdsOrUpdateWithGivenResourceIds(newAction, null);
                    })
                    .collectList()
                    .flatMapMany(newActionService::saveAll);
        });

        Flux<ActionCollection> actionCollectionFlux = newPageFlux.flatMap(newPage -> {
            return actionCollectionService
                    .findByPageId(newPage.getId())
                    .map(actionCollection -> {
                        actionCollection.setDefaultResources(null);
                        if (actionCollection.getUnpublishedCollection() != null) {
                            actionCollection.getUnpublishedCollection().setDefaultResources(null);
                        }
                        if (actionCollection.getPublishedCollection() != null) {
                            actionCollection.getPublishedCollection().setDefaultResources(null);
                        }
                        return createDefaultIdsOrUpdateWithGivenResourceIds(actionCollection, null);
                    })
                    .collectList()
                    .flatMapMany(actionCollectionService::saveAll);
        });

        return Flux.merge(actionCollectionFlux, newActionFlux)
                .then(Mono.just(defaultApplication))
                .map(responseUtils::updateApplicationWithDefaultResources);
    }

    @Override
    public Application updateArtifactWithDefaultReponseUtils(Artifact artifact) {
        return responseUtils.updateApplicationWithDefaultResources((Application) artifact);
    }
}
