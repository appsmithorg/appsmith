package com.appsmith.server.repositories.ce;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.ApplicationPage;
import com.appsmith.server.domains.GitAuth;
import com.appsmith.server.repositories.AppsmithRepository;
import com.mongodb.client.result.UpdateResult;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

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

    Optional<UpdateResult> addPageToApplication(
            String applicationId, String pageId, boolean isDefault, String defaultPageId);

    @Modifying
    @Query(value = "UPDATE Application SET pages = :pages WHERE id = :applicationId")
    default Optional<UpdateResult> setPages(String applicationId, List<ApplicationPage> pages) {
        return Optional.empty();
    }
    ;

    Optional<UpdateResult> setDefaultPage(String applicationId, String pageId);

    Optional<UpdateResult> setGitAuth(String applicationId, GitAuth gitAuth, AclPermission aclPermission);

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

    List<String> getAllApplicationId(String workspaceId);

    Optional<UpdateResult> setAppTheme(
            String applicationId, String editModeThemeId, String publishedModeThemeId, AclPermission aclPermission);

    Optional<Long> countByWorkspaceId(String workspaceId);

    Optional<Long> getGitConnectedApplicationWithPrivateRepoCount(String workspaceId);

    List<Application> getGitConnectedApplicationByWorkspaceId(String workspaceId);

    Optional<Application> getApplicationByDefaultApplicationIdAndDefaultBranch(String defaultApplicationId);

    Optional<UpdateResult> updateFieldByDefaultIdAndBranchName(
            String defaultId,
            String defaultIdPath,
            Map<String, Object> fieldNameValueMap,
            String branchName,
            String branchNamePath,
            AclPermission permission);

    Optional<Long> countByNameAndWorkspaceId(String applicationName, String workspaceId, AclPermission permission);

    List<Object> getAllApplicationIdsInWorkspaceAccessibleToARoleWithPermission(
            String workspaceId, AclPermission permission, String permissionGroupId);

    Optional<Long> getAllApplicationsCountAccessibleToARoleWithPermission(
            AclPermission permission, String permissionGroupId);

    Optional<UpdateResult> unprotectAllBranches(String applicationId, AclPermission permission);

    Optional<UpdateResult> protectBranchedApplications(
            String applicationId, List<String> branchNames, AclPermission permission);
}
