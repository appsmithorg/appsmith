package com.appsmith.server.repositories.ce;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.NewPage;
import com.appsmith.server.repositories.AppsmithRepository;

import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.Optional;

public interface CustomNewPageRepositoryCE extends AppsmithRepository<NewPage> {

    List<NewPage> findByApplicationId(String applicationId, AclPermission aclPermission);

    List<NewPage> findByApplicationIdAndNonDeletedEditMode(String applicationId, AclPermission aclPermission);

    Optional<NewPage> findByIdAndLayoutsIdAndViewMode(
            String id, String layoutId, AclPermission aclPermission, Boolean viewMode);

    Optional<NewPage> findByNameAndViewMode(String name, AclPermission aclPermission, Boolean viewMode);

    Optional<NewPage> findByNameAndApplicationIdAndViewMode(
            String name, String applicationId, AclPermission aclPermission, Boolean viewMode);

    List<NewPage> findAllPageDTOsByIds(List<String> ids, AclPermission aclPermission);

    Optional<String> getNameByPageId(String pageId, boolean isPublishedName);

    Optional<NewPage> findPageByBranchNameAndDefaultPageId(
            String branchName, String defaultPageId, AclPermission permission);

    List<NewPage> findSlugsByApplicationIds(List<String> applicationIds, AclPermission aclPermission);

    Optional<NewPage> findByGitSyncIdAndDefaultApplicationId(
            String defaultApplicationId, String gitSyncId, AclPermission permission);

    Optional<NewPage> findByGitSyncIdAndDefaultApplicationId(
            String defaultApplicationId, String gitSyncId, Optional<AclPermission> permission);

    Optional<Void> publishPages(Collection<String> pageIds, AclPermission permission);

    List<NewPage> findAllByApplicationIdsWithoutPermission(List<String> applicationIds, List<String> includeFields);

    Optional<String> findBranchedPageId(String branchName, String defaultPageId, AclPermission permission);

    Optional<Integer> updateDependencyMap(String pageId, Map<String, List<String>> dependencyMap);
}
