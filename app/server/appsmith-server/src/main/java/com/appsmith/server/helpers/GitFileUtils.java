package com.appsmith.server.helpers;

import com.appsmith.external.git.FileInterface;
import com.appsmith.external.models.ApplicationGitReference;
import com.appsmith.git.helpers.FileUtilsImpl;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.ApplicationJson;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Import;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;

import java.nio.file.Path;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@Component
@Import({FileUtilsImpl.class})
public class GitFileUtils {

    @Autowired
    FileInterface fileUtils;

    /**
     * This method will save the complete application in the local repo directory.
     * Path to repo will be : ./container-volumes/git-repo/organizationId/defaultApplicationId/branchName/{application_data}
     * @param defaultApplicationId this is equivalent to default branch in git and will be used for creating the path
     * @param organizationId organization from which application needs to dehydrated from the DB
     * @param applicationJson application reference object from which entire application can be rehydrated
     * @param branchName name of the branch for the current application
     * @return repo path where the application is stored
     */
    public Mono<Path> saveApplicationToGitRepo(String organizationId,
                                               String defaultApplicationId,
                                               ApplicationJson applicationJson,
                                               String branchName) {

        /*
            1. Create application reference for appsmith-git module
            2. Save application to git repo
         */
        ApplicationGitReference applicationReference = new ApplicationGitReference();

        // Pass application reference
        applicationReference.setApplication(applicationJson.getExportedApplication());

        // Pass pages within the application
        Map<String, Object> resourceMap = new HashMap<>();
        applicationJson.getPageList().forEach(newPage -> {
            String pageName = "";
            if (newPage.getUnpublishedPage() != null) {
                pageName = newPage.getUnpublishedPage().getName();
            } else if (newPage.getPublishedPage() != null) {
                pageName = newPage.getPublishedPage().getName();
            }
            // pageName will be used for naming the json file
            resourceMap.put(pageName, newPage);
        });
        applicationReference.setPages(new HashMap<>(resourceMap));
        resourceMap.clear();

        // Send actions
        applicationJson.getActionList().forEach(newAction -> {
            String prefix = newAction.getUnpublishedAction() != null ?
                newAction.getUnpublishedAction().getName() + "_" + newAction.getUnpublishedAction().getPageId()
                : newAction.getPublishedAction().getName() + "_" + newAction.getPublishedAction().getPageId();
            resourceMap.put(prefix, newAction);
        });
        applicationReference.setActions(new HashMap<>(resourceMap));
        resourceMap.clear();

        // Send datasources
        applicationJson.getDatasourceList().forEach(
            datasource -> resourceMap.put(datasource.getName(), datasource)
        );
        applicationReference.setDatasources(new HashMap<>(resourceMap));
        resourceMap.clear();

        // Save application to git repo
        return fileUtils.saveApplicationToGitRepo(organizationId, defaultApplicationId, applicationReference, branchName);
    }

    /**
     * This will reconstruct the application from the repo
     * @param organisationId To which organisation application needs to be rehydrated
     * @param defaultApplicationId To which organisation application needs to be rehydrated
     * @param branchName for which the application needs to be rehydrate
     * @return application reference from which entire application can be rehydrated
     */
    public ApplicationJson reconstructApplicationFromGitRepo(String organisationId,
                                                             String defaultApplicationId,
                                                             String branchName) {

        // For implementing a branching model we are using worktree structure so each branch will have the separate
        // directory, this decision has been taken considering multiple users can checkout different branches at same
        // time
        // API reference for worktree : https://git-scm.com/docs/git-worktree

        ApplicationJson applicationJson = new ApplicationJson();

        ApplicationGitReference applicationReference =
            fileUtils.reconstructApplicationFromGitRepo(organisationId, defaultApplicationId, branchName);

        // Extract application data from the json
        applicationJson.setExportedApplication((Application) applicationReference.getApplication());

        // Extract actions
        applicationJson.setActionList(getApplicationResource(applicationReference.getActions()));

        // Extract pages
        applicationJson.setPageList(getApplicationResource(applicationReference.getPages()));

        // Extract datasources
        applicationJson.setDatasourceList(getApplicationResource(applicationReference.getDatasources()));

        return applicationJson;
    }

    private <T> List<T> getApplicationResource(Map<String, Object> resources) {

        List<T> deserializedResources = new ArrayList<>();
        for (Map.Entry<String, Object> resource : resources.entrySet()) {
            deserializedResources.add((T) resource.getValue());
        }
        return deserializedResources;
    }
}
