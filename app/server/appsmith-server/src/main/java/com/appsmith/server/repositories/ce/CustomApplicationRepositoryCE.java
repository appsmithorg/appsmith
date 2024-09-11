package com.appsmith.server.repositories.ce;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.ApplicationPage;
import com.appsmith.server.repositories.AppsmithRepository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;

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

    Mono<Integer> addPageToApplication(String applicationId, String pageId, boolean isDefault, String basePageId);

    Mono<Integer> setPages(String applicationId, List<ApplicationPage> pages);

    Mono<Void> setDefaultPage(String applicationId, String pageId);

    Mono<Application> getApplicationByGitBranchAndBaseApplicationId(
            String baseApplicationId, String branchName, Optional<AclPermission> permission);

    Mono<Application> getApplicationByGitBranchAndBaseApplicationId(
            String baseApplicationId, String branchName, AclPermission aclPermission);

    Mono<Application> getApplicationByGitBranchAndBaseApplicationId(
            String baseApplicationId,
            List<String> projectionFieldNames,
            String branchName,
            AclPermission aclPermission);

    Flux<Application> getApplicationByGitBaseApplicationId(String baseApplicationId, AclPermission permission);

    Mono<Integer> setAppTheme(
            String applicationId, String editModeThemeId, String publishedModeThemeId, AclPermission aclPermission);

    Mono<Long> getGitConnectedApplicationWithPrivateRepoCount(String workspaceId);

    Flux<Application> getGitConnectedApplicationByWorkspaceId(String workspaceId);

    Mono<Application> getApplicationByBaseApplicationIdAndDefaultBranch(String baseApplicationId);

    Mono<Integer> updateFieldById(
            String id, String idPath, Map<String, Object> fieldNameValueMap, AclPermission permission);

    Mono<Long> countByNameAndWorkspaceId(String applicationName, String workspaceId, AclPermission permission);

    Flux<String> getAllApplicationIdsInWorkspaceAccessibleToARoleWithPermission(
            String workspaceId, AclPermission permission, String permissionGroupId);

    Mono<Long> getAllApplicationsCountAccessibleToARoleWithPermission(
            AclPermission permission, String permissionGroupId);

    Mono<Integer> unprotectAllBranches(String applicationId, AclPermission permission);

    Mono<Integer> protectBranchedApplications(String applicationId, List<String> branchNames, AclPermission permission);

    Flux<String> findBranchedApplicationIdsByBaseApplicationId(String baseApplicationId);

    Flux<String> findAllBranchedApplicationIdsByBranchedApplicationId(
            String branchedApplicationId, AclPermission permission);
}
