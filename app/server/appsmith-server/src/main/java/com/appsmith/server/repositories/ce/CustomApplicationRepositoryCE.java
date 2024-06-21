package com.appsmith.server.repositories.ce;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.ApplicationPage;
import com.appsmith.server.domains.User;
import com.appsmith.server.repositories.AppsmithRepository;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;

public interface CustomApplicationRepositoryCE extends AppsmithRepository<Application> {

    Optional<Application> findByIdAndWorkspaceId(
            String id, String workspaceId, AclPermission permission, User currentUser);

    Optional<Application> findByName(String name, AclPermission permission, User currentUser);

    List<Application> findByWorkspaceId(String workspaceId, AclPermission permission, User currentUser);

    List<Application> findByMultipleWorkspaceIds(Set<String> workspaceIds, AclPermission permission, User currentUser);

    /**
     * Finds all the applications that are directly assigned to the user.
     * This method would not return public applications.
     *
     * @param permission
     * @return A List of applications.
     */
    List<Application> findAllUserApps(AclPermission permission, User currentUser);

    List<Application> findByClonedFromApplicationId(String applicationId, AclPermission permission, User currentUser);

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
            String defaultApplicationId, String branchName, Optional<AclPermission> permission, User currentUser);

    Optional<Application> getApplicationByGitBranchAndDefaultApplicationId(
            String defaultApplicationId, String branchName, AclPermission permission, User currentUser);

    Optional<Application> getApplicationByGitBranchAndDefaultApplicationId(
            String defaultApplicationId,
            List<String> projectionFieldNames,
            String branchName,
            AclPermission permission,
            User currentUser);

    List<Application> getApplicationByGitDefaultApplicationId(
            String defaultApplicationId, AclPermission permission, User currentUser);

    int setAppTheme(
            String applicationId,
            String editModeThemeId,
            String publishedModeThemeId,
            AclPermission permission,
            User currentUser);

    Optional<Long> getGitConnectedApplicationWithPrivateRepoCount(String workspaceId);

    List<Application> getGitConnectedApplicationByWorkspaceId(
            String workspaceId, AclPermission permission, User currentUser);

    Optional<Application> getApplicationByDefaultApplicationIdAndDefaultBranch(String defaultApplicationId);

    Optional<Integer> updateFieldByDefaultIdAndBranchName(
            String defaultId,
            String defaultIdPath,
            Map<String, Object> fieldNameValueMap,
            String branchName,
            String branchNamePath,
            AclPermission permission,
            User currentUser);

    Optional<Long> countByNameAndWorkspaceId(
            String applicationName, String workspaceId, AclPermission permission, User currentUser);

    List<String> getAllApplicationIdsInWorkspaceAccessibleToARoleWithPermission(
            String workspaceId, AclPermission permission, User currentUser, String permissionGroupId);

    Optional<Long> getAllApplicationsCountAccessibleToARoleWithPermission(
            AclPermission permission, User currentUser, String permissionGroupId);

    int unprotectAllBranches(String applicationId, AclPermission permission, User currentUser);

    int protectBranchedApplications(
            String applicationId, List<String> branchNames, AclPermission permission, User currentUser);
}
