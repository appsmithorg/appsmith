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

    Optional<NewPage> findById(String id, AclPermission permission, User currentUser, List<String> projectedFields, EntityManager entityManager);

    List<NewPage> findByApplicationId(String applicationId, AclPermission permission, User currentUser, EntityManager entityManager);

    List<NewPage> findByApplicationId(
            String applicationId, AclPermission permission, User currentUser, List<String> includeFields, EntityManager entityManager);

    List<NewPage> findByApplicationIdAndNonDeletedEditMode(
            String applicationId, AclPermission permission, User currentUser, EntityManager entityManager);

    Optional<NewPage> findByIdAndLayoutsIdAndViewMode(
            String id, String layoutId, AclPermission permission, User currentUser, Boolean viewMode, EntityManager entityManager);

    Optional<NewPage> findByNameAndViewMode(String name, AclPermission permission, User currentUser, Boolean viewMode, EntityManager entityManager);

    Optional<NewPage> findByNameAndApplicationIdAndViewMode(
            String name, String applicationId, Boolean viewMode, AclPermission permission, User currentUser, EntityManager entityManager);

    List<NewPage> findAllPageDTOsByIds(List<String> ids, AclPermission permission, User currentUser, EntityManager entityManager);

    Optional<String> getNameByPageId(String pageId, boolean isPublishedName, EntityManager entityManager);

    Optional<NewPage> findPageByBranchNameAndBasePageId(
            String branchName,
            String basePageId,
            AclPermission permission, User currentUser,
            List<String> projectedFieldNames, EntityManager entityManager);

    List<NewPage> findAllByApplicationIds(List<String> branchedArtifactIds, List<String> includedFields, EntityManager entityManager);

    Optional<Void> publishPages(Collection<String> pageIds, AclPermission permission, User currentUser, EntityManager entityManager);

    List<NewPage> findAllByApplicationIdsWithoutPermission(List<String> applicationIds, List<String> includeFields, EntityManager entityManager);

    Optional<Integer> updateDependencyMap(String pageId, Map<String, List<String>> dependencyMap, EntityManager entityManager);
}
