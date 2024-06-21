package com.appsmith.server.repositories.ce;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.NewPage;
import com.appsmith.server.domains.User;
import com.appsmith.server.repositories.AppsmithRepository;

import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.Optional;

public interface CustomNewPageRepositoryCE extends AppsmithRepository<NewPage> {

    List<NewPage> findByApplicationId(String applicationId, AclPermission permission, User currentUser);

    List<NewPage> findByApplicationIdAndNonDeletedEditMode(
            String applicationId, AclPermission permission, User currentUser);

    Optional<NewPage> findByIdAndLayoutsIdAndViewMode(
            String id, String layoutId, Boolean viewMode, AclPermission permission, User currentUser);

    Optional<NewPage> findByNameAndViewMode(String name, Boolean viewMode, AclPermission permission, User currentUser);

    Optional<NewPage> findByNameAndApplicationIdAndViewMode(
            String name, String applicationId, Boolean viewMode, AclPermission permission, User currentUser);

    List<NewPage> findAllPageDTOsByIds(List<String> ids, AclPermission permission, User currentUser);

    Optional<String> getNameByPageId(String pageId, boolean isPublishedName);

    Optional<NewPage> findPageByBranchNameAndDefaultPageId(
            String branchName, String defaultPageId, AclPermission permission, User currentUser);

    Optional<NewPage> findByGitSyncIdAndDefaultApplicationId(
            String defaultApplicationId, String gitSyncId, AclPermission permission, User currentUser);

    Optional<NewPage> findByGitSyncIdAndDefaultApplicationId(
            String defaultApplicationId, String gitSyncId, Optional<AclPermission> permission, User currentUser);

    Optional<Void> publishPages(Collection<String> pageIds, AclPermission permission, User currentUser);

    List<NewPage> findAllByApplicationIdsWithoutPermission(List<String> applicationIds, List<String> includeFields);

    Optional<String> findBranchedPageId(
            String branchName, String defaultPageId, AclPermission permission, User currentUser);

    Optional<Integer> updateDependencyMap(String pageId, Map<String, List<String>> dependencyMap);
}
