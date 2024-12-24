package com.appsmith.server.repositories.ce;

import com.appsmith.external.models.CreatorContextType;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.NewAction;
import com.appsmith.server.domains.User;
import com.appsmith.server.repositories.AppsmithRepository;
import jakarta.persistence.EntityManager;
import org.springframework.data.domain.Sort;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.Set;

public interface CustomNewActionRepositoryCE extends AppsmithRepository<NewAction> {

    List<NewAction> findByApplicationId(
            String applicationId, AclPermission permission, User currentUser, EntityManager entityManager);

    Optional<NewAction> findByUnpublishedNameAndPageId(
            String name, String pageId, AclPermission permission, User currentUser, EntityManager entityManager);

    List<NewAction> findByPageId(
            String pageId, AclPermission permission, User currentUser, EntityManager entityManager);

    List<NewAction> findByPageId(
            String pageId, Optional<AclPermission> permission, User currentUser, EntityManager entityManager);

    List<NewAction> findByPageId(String pageId, EntityManager entityManager);

    List<NewAction> findByPageIdAndViewMode(
            String pageId, Boolean viewMode, AclPermission permission, User currentUser, EntityManager entityManager);

    List<NewAction> findUnpublishedActionsByNameInAndPageId(
            Set<String> names, String pageId, AclPermission permission, User currentUser, EntityManager entityManager);

    List<NewAction> findUnpublishedActionsByPageIdAndExecuteOnLoadSetByUserTrue(
            String pageId, AclPermission permission, User currentUser, EntityManager entityManager);

    List<NewAction> findAllActionsByNameAndPageIdsAndViewMode(
            String name,
            List<String> pageIds,
            Boolean viewMode,
            AclPermission permission,
            User currentUser,
            Sort sort,
            EntityManager entityManager);

    List<NewAction> findByApplicationId(
            String applicationId, AclPermission permission, User currentUser, Sort sort, EntityManager entityManager);

    List<NewAction> findPublishedActionsByPageIdAndExcludedPluginType(
            String pageId,
            List<String> pluginTypes,
            AclPermission permission,
            User currentUser,
            Sort sort,
            EntityManager entityManager);

    List<NewAction> findPublishedActionsByAppIdAndExcludedPluginType(
            String appId,
            List<String> pluginTypes,
            AclPermission permission,
            User currentUser,
            Sort sort,
            EntityManager entityManager);

    List<NewAction> findByApplicationId(
            String applicationId,
            Optional<AclPermission> permission,
            User currentUser,
            Optional<Sort> sort,
            EntityManager entityManager);

    List<NewAction> findByApplicationIdAndViewMode(
            String applicationId,
            Boolean viewMode,
            AclPermission permission,
            User currentUser,
            EntityManager entityManager);

    Optional<Long> countByDatasourceId(String datasourceId, EntityManager entityManager);

    Optional<NewAction> findByBranchNameAndBaseActionId(
            String branchName,
            String baseActionId,
            Boolean viewMode,
            AclPermission permission,
            User currentUser,
            EntityManager entityManager);

    List<NewAction> findByPageIds(
            List<String> pageIds, AclPermission permission, User currentUser, EntityManager entityManager);

    List<NewAction> findByPageIds(
            List<String> pageIds, Optional<AclPermission> permission, User currentUser, EntityManager entityManager);

    List<NewAction> findNonJsActionsByApplicationIdAndViewMode(
            String applicationId,
            Boolean viewMode,
            AclPermission permission,
            User currentUser,
            EntityManager entityManager);

    List<NewAction> findAllNonJsActionsByNameAndPageIdsAndViewMode(
            String name,
            List<String> pageIds,
            Boolean viewMode,
            AclPermission permission,
            User currentUser,
            Sort sort,
            EntityManager entityManager);

    Optional<Void> publishActions(
            String applicationId, AclPermission permission, User currentUser, EntityManager entityManager);

    Optional<Integer> archiveDeletedUnpublishedActions(
            String applicationId, AclPermission permission, User currentUser, EntityManager entityManager);

    List<NewAction> findAllByApplicationIdsWithoutPermission(
            List<String> applicationIds, List<String> includeFields, EntityManager entityManager);

    List<NewAction> findAllByCollectionIds(
            List<String> collectionIds,
            boolean viewMode,
            AclPermission permission,
            User currentUser,
            EntityManager entityManager);

    List<NewAction> findAllUnpublishedActionsByContextIdAndContextType(
            String contextId,
            CreatorContextType contextType,
            AclPermission permission,
            User currentUser,
            boolean includeJs,
            EntityManager entityManager);

    List<NewAction> findAllPublishedActionsByContextIdAndContextType(
            String contextId,
            CreatorContextType contextType,
            AclPermission permission,
            User currentUser,
            boolean includeJs,
            EntityManager entityManager);

    List<NewAction> findAllByIdIn(Collection<String> ids, EntityManager entityManager);

    List<NewAction> findAllByApplicationIds(
            List<String> branchedArtifactIds, List<String> includedFields, EntityManager entityManager);

    // @Meta(cursorBatchSize = 10000)
    // TODO Implement cursor with batch size
    List<NewAction> findByApplicationId(String applicationId, EntityManager entityManager);

    // @Meta(cursorBatchSize = 10000)
    // TODO Implement cursor with batch size
    List<NewAction> findAllByIdIn(Iterable<String> ids, EntityManager entityManager);

    Optional<Long> countByDeletedAtNull(EntityManager entityManager);
}
