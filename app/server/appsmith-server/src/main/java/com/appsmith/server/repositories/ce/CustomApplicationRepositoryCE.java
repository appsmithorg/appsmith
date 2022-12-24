package com.appsmith.server.repositories.ce;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.ApplicationPage;
import com.appsmith.server.domains.GitAuth;
import com.appsmith.server.repositories.AppsmithRepository;
import com.mongodb.client.result.UpdateResult;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.Set;
import java.util.Map;

public interface CustomApplicationRepositoryCE extends AppsmithRepository<Application> {

    Mono<Application> findByIdAndWorkspaceId(String id, String workspaceId, AclPermission permission);

    Mono<Application> findByName(String name, AclPermission permission);

    Flux<Application> findByWorkspaceId(String workspaceId, AclPermission permission);

    Flux<Application> findByMultipleWorkspaceIds(Set<String> workspaceIds, AclPermission permission);

    /**
     * Finds all the applications that are directly assigned to the user.
     * This method would not return public applications.
     *
     * @param permission
     * @return A Flux of applications.
     */
    Flux<Application> findAllUserApps(AclPermission permission);

    Flux<Application> findByClonedFromApplicationId(String applicationId, AclPermission permission);

    Mono<UpdateResult> addPageToApplication(String applicationId, String pageId, boolean isDefault, String defaultPageId);

    Mono<UpdateResult> setPages(String applicationId, List<ApplicationPage> pages);

    Mono<UpdateResult> setDefaultPage(String applicationId, String pageId);

    Mono<UpdateResult> setGitAuth(String applicationId, GitAuth gitAuth, AclPermission aclPermission);

    Mono<Application> getApplicationByGitBranchAndDefaultApplicationId(String defaultApplicationId, String branchName, AclPermission aclPermission);

    Mono<Application> getApplicationByGitBranchAndDefaultApplicationId(String defaultApplicationId,
                                                                       List<String> projectionFieldNames,
                                                                       String branchName,
                                                                       AclPermission aclPermission);

    Flux<Application> getApplicationByGitDefaultApplicationId(String defaultApplicationId, AclPermission permission);

    Mono<List<String>> getAllApplicationId(String workspaceId);

    Mono<UpdateResult> setAppTheme(String applicationId, String editModeThemeId, String publishedModeThemeId, AclPermission aclPermission);

    Mono<Long> countByWorkspaceId(String workspaceId);

    Mono<Long> getGitConnectedApplicationWithPrivateRepoCount(String workspaceId);

    Flux<Application> getGitConnectedApplicationByWorkspaceId(String workspaceId);

    Mono<Application> getApplicationByDefaultApplicationIdAndDefaultBranch(String defaultApplicationId);

    Mono<UpdateResult> updateFieldByDefaultIdAndBranchName(String defaultId, String defaultIdPath, Map<String,
            Object> fieldNameValueMap, String branchName, String branchNamePath, AclPermission permission);
}
