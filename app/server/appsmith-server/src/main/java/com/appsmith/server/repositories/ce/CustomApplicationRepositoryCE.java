package com.appsmith.server.repositories.ce;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.ApplicationPage;
import com.appsmith.server.repositories.AppsmithRepository;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;

public interface CustomApplicationRepositoryCE extends AppsmithRepository<Application> {

    Optional<Application> findByIdAndWorkspaceId(String id, String workspaceId, AclPermission permission);

    Optional<Application> findByName(String name, AclPermission permission);

    List<Application> findByWorkspaceId(String workspaceId, AclPermission permission);

    List<Application> findByMultipleWorkspaceIds(Set<String> workspaceIds, AclPermission permission);

    /**
     * Finds all the applications that are directly assigned to the user.
     * This method would not return public applications.
     *
     * @param permission
     * @return A List of applications.
     */
    List<Application> findAllUserApps(AclPermission permission);

    List<Application> findByClonedFromApplicationId(String applicationId, AclPermission permission);

    Optional<Integer> addPageToApplication(
            String applicationId, String pageId, boolean isDefault, String defaultPageId);

    /*@Modifying
    @Query(value = "UPDATE Application SET pages = :pages WHERE id = :applicationId")
    no-cake default int setPages(String applicationId, List<ApplicationPage> pages) {
        return Optional.empty();
    }*/

    int setPages(String applicationId, List<ApplicationPage> pages);

    Optional<Void> setDefaultPage(String applicationId, String pageId);

    Optional<Application> getApplicationByGitBranchAndDefaultApplicationId(
            String defaultApplicationId, String branchName, Optional<AclPermission> permission);

    Optional<Application> getApplicationByGitBranchAndDefaultApplicationId(
            String defaultApplicationId, String branchName, AclPermission aclPermission);

    Optional<Application> getApplicationByGitBranchAndDefaultApplicationId(
            String defaultApplicationId,
            List<String> projectionFieldNames,
            String branchName,
            AclPermission aclPermission);

    List<Application> getApplicationByGitDefaultApplicationId(String defaultApplicationId, AclPermission permission);

    int setAppTheme(
            String applicationId, String editModeThemeId, String publishedModeThemeId, AclPermission aclPermission);

    Optional<Long> getGitConnectedApplicationWithPrivateRepoCount(String workspaceId);

    List<Application> getGitConnectedApplicationByWorkspaceId(String workspaceId);

    Optional<Application> getApplicationByDefaultApplicationIdAndDefaultBranch(String defaultApplicationId);

    Optional<Integer> updateFieldByDefaultIdAndBranchName(
            String defaultId,
            String defaultIdPath,
            Map<String, Object> fieldNameValueMap,
            String branchName,
            String branchNamePath,
            AclPermission permission);

    Optional<Long> countByNameAndWorkspaceId(String applicationName, String workspaceId, AclPermission permission);

    List<String> getAllApplicationIdsInWorkspaceAccessibleToARoleWithPermission(
            String workspaceId, AclPermission permission, String permissionGroupId);

    Optional<Long> getAllApplicationsCountAccessibleToARoleWithPermission(
            AclPermission permission, String permissionGroupId);

    int unprotectAllBranches(String applicationId, AclPermission permission);

    Optional<Integer> protectBranchedApplications(
            String applicationId, List<String> branchNames, AclPermission permission);
}
