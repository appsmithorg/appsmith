package com.appsmith.server.repositories.ce;

import com.appsmith.external.git.constants.ce.RefType;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.NewPage;
import com.appsmith.server.domains.User;
import com.appsmith.server.repositories.AppsmithRepository;

import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.Optional;

public interface CustomNewPageRepositoryCE extends AppsmithRepository<NewPage> {

    Optional<NewPage> findById(String id, AclPermission permission, User currentUser, List<String> projectedFields);

    List<NewPage> findByApplicationId(String applicationId, AclPermission permission, User currentUser);

    List<NewPage> findByApplicationId(
            String applicationId, AclPermission permission, User currentUser, List<String> includeFields);

    List<NewPage> findByApplicationIdAndNonDeletedEditMode(
            String applicationId, AclPermission permission, User currentUser);

    Optional<NewPage> findByIdAndLayoutsIdAndViewMode(
            String id, String layoutId, AclPermission permission, User currentUser, Boolean viewMode);

    Optional<NewPage> findByNameAndViewMode(String name, AclPermission permission, User currentUser, Boolean viewMode);

    Optional<NewPage> findByNameAndApplicationIdAndViewMode(
            String name, String applicationId, Boolean viewMode, AclPermission permission, User currentUser);

    List<NewPage> findAllPageDTOsByIds(List<String> ids, AclPermission permission, User currentUser);

    Optional<String> getNameByPageId(String pageId, boolean isPublishedName);

    Optional<NewPage> findPageByRefTypeAndRefNameAndBasePageId(
            RefType refType,
            String refName,
            String basePageId,
            AclPermission permission,
            User currentUser,
            List<String> projectedFieldNames);

    List<NewPage> findAllByApplicationIds(List<String> branchedArtifactIds, List<String> includedFields);

    Optional<Void> publishPages(Collection<String> pageIds, AclPermission permission, User currentUser);

    List<NewPage> findAllByApplicationIdsWithoutPermission(List<String> applicationIds, List<String> includeFields);

    Optional<Integer> updateDependencyMap(String pageId, Map<String, List<String>> dependencyMap);

    List<NewPage> findByApplicationId(String applicationId);

    Optional<Long> countByDeletedAtNull();
}
