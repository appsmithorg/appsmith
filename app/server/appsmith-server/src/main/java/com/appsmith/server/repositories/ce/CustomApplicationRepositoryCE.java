package com.appsmith.server.repositories.ce;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.ApplicationPage;
import com.appsmith.server.domains.User;
import com.appsmith.server.repositories.AppsmithRepository;
import jakarta.persistence.EntityManager;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;

public interface CustomApplicationRepositoryCE extends AppsmithRepository<Application> {

    Optional<Application> findByIdAndWorkspaceId(
            String id, String workspaceId, AclPermission permission, User currentUser, EntityManager entityManager);

    Optional<Application> findByName(
            String name, AclPermission permission, User currentUser, EntityManager entityManager);

    List<Application> findByWorkspaceId(
            String workspaceId, AclPermission permission, User currentUser, EntityManager entityManager);

    List<Application> findByMultipleWorkspaceIds(
            Set<String> workspaceIds, AclPermission permission, User currentUser, EntityManager entityManager);

    /**
     * Finds all the applications that are directly assigned to the user.
     * This method would not return public applications.
     *
     * @param permission
     * @return A List of applications.
     */
    List<Application> findAllUserApps(AclPermission permission, User currentUser, EntityManager entityManager);

    List<Application> findByClonedFromApplicationId(
            String applicationId, AclPermission permission, User currentUser, EntityManager entityManager);

    Optional<Integer> addPageToApplication(
            String applicationId, String pageId, boolean isDefault, String basePageId, EntityManager entityManager);

    /*@Modifying
    @Query(value = "UPDATE Application SET pages = :pages WHERE id = :applicationId")
    no-cake default int setPages(String applicationId, List<ApplicationPage> pages) {
        return Optional.empty(, EntityManager entityManager);
    }*/

    int setPages(String applicationId, List<ApplicationPage> pages, EntityManager entityManager);

    Optional<Void> setDefaultPage(String applicationId, String pageId, EntityManager entityManager);

    Optional<Application> getApplicationByGitBranchAndBaseApplicationId(
            String baseApplicationId,
            String branchName,
            AclPermission permission,
            User currentUser,
            EntityManager entityManager);

    Optional<Application> getApplicationByGitBranchAndBaseApplicationId(
            String baseApplicationId,
            List<String> projectionFieldNames,
            String branchName,
            AclPermission permission,
            User currentUser,
            EntityManager entityManager);

    List<Application> getApplicationByGitBaseApplicationId(
            String baseApplicationId, AclPermission permission, User currentUser, EntityManager entityManager);

    int setAppTheme(
            String applicationId,
            String editModeThemeId,
            String publishedModeThemeId,
            AclPermission permission,
            User currentUser,
            EntityManager entityManager);

    Optional<Long> getGitConnectedApplicationWithPrivateRepoCount(String workspaceId, EntityManager entityManager);

    List<Application> getGitConnectedApplicationByWorkspaceId(
            String workspaceId, AclPermission permission, User currentUser, EntityManager entityManager);

    Optional<Application> getApplicationByBaseApplicationIdAndDefaultBranch(
            String baseApplicationId, EntityManager entityManager);

    Optional<Integer> updateFieldById(
            String id,
            String idPath,
            Map<String, Object> fieldNameValueMap,
            AclPermission permission,
            User currentUser,
            EntityManager entityManager);

    Optional<Long> countByNameAndWorkspaceId(
            String applicationName,
            String workspaceId,
            AclPermission permission,
            User currentUser,
            EntityManager entityManager);

    List<String> getAllApplicationIdsInWorkspaceAccessibleToARoleWithPermission(
            String workspaceId,
            AclPermission permission,
            User currentUser,
            String permissionGroupId,
            EntityManager entityManager);

    Optional<Long> getAllApplicationsCountAccessibleToARoleWithPermission(
            AclPermission permission, User currentUser, String permissionGroupId, EntityManager entityManager);

    int unprotectAllBranches(
            String applicationId, AclPermission permission, User currentUser, EntityManager entityManager);

    int protectBranchedApplications(
            String applicationId,
            List<String> branchNames,
            AclPermission permission,
            User currentUser,
            EntityManager entityManager);

    List<String> findBranchedApplicationIdsByBaseApplicationId(String baseApplicationId, EntityManager entityManager);

    List<String> findAllBranchedApplicationIdsByBranchedApplicationId(
            String branchedApplicationId, AclPermission permission, User currentUser, EntityManager entityManager);
}
