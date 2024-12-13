package com.appsmith.server.repositories.ce;

import com.appsmith.external.models.CreatorContextType;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.NewAction;
import com.appsmith.server.domains.User;
import com.appsmith.server.projections.IdPoliciesOnly;
import com.appsmith.server.repositories.AppsmithRepository;
import org.springframework.data.domain.Sort;

import java.util.List;
import java.util.Optional;
import java.util.Set;

public interface CustomNewActionRepositoryCE extends AppsmithRepository<NewAction> {

    List<NewAction> findByApplicationId(String applicationId, AclPermission permission, User currentUser);

    Optional<NewAction> findByUnpublishedNameAndPageId(
            String name, String pageId, AclPermission permission, User currentUser);

    List<NewAction> findByPageId(String pageId, AclPermission permission, User currentUser);

    List<NewAction> findByPageId(String pageId, Optional<AclPermission> permission, User currentUser);

    List<NewAction> findByPageId(String pageId);

    List<NewAction> findByPageIdAndViewMode(
            String pageId, Boolean viewMode, AclPermission permission, User currentUser);

    List<NewAction> findUnpublishedActionsByNameInAndPageId(
            Set<String> names, String pageId, AclPermission permission, User currentUser);

    List<NewAction> findUnpublishedActionsByPageIdAndExecuteOnLoadSetByUserTrue(
            String pageId, AclPermission permission, User currentUser);

    List<NewAction> findAllActionsByNameAndPageIdsAndViewMode(
            String name, List<String> pageIds, Boolean viewMode, AclPermission permission, User currentUser, Sort sort);

    List<NewAction> findByApplicationId(String applicationId, AclPermission permission, User currentUser, Sort sort);

    List<NewAction> findPublishedActionsByPageIdAndExcludedPluginType(
            String pageId, List<String> pluginTypes, AclPermission permission, User currentUser, Sort sort);

    List<NewAction> findPublishedActionsByAppIdAndExcludedPluginType(
            String appId, List<String> pluginTypes, AclPermission permission, User currentUser, Sort sort);

    List<NewAction> findByApplicationId(
            String applicationId, Optional<AclPermission> permission, User currentUser, Optional<Sort> sort);

    List<NewAction> findByApplicationIdAndViewMode(
            String applicationId, Boolean viewMode, AclPermission permission, User currentUser);

    Optional<Long> countByDatasourceId(String datasourceId);

    Optional<NewAction> findByBranchNameAndBaseActionId(
            String branchName, String baseActionId, Boolean viewMode, AclPermission permission, User currentUser);

    List<NewAction> findByPageIds(List<String> pageIds, AclPermission permission, User currentUser);

    List<NewAction> findByPageIds(List<String> pageIds, Optional<AclPermission> permission, User currentUser);

    List<NewAction> findNonJsActionsByApplicationIdAndViewMode(
            String applicationId, Boolean viewMode, AclPermission permission, User currentUser);

    List<NewAction> findAllNonJsActionsByNameAndPageIdsAndViewMode(
            String name, List<String> pageIds, Boolean viewMode, AclPermission permission, User currentUser, Sort sort);

    Optional<Void> publishActions(String applicationId, AclPermission permission, User currentUser);

    Optional<Integer> archiveDeletedUnpublishedActions(
            String applicationId, AclPermission permission, User currentUser);

    List<NewAction> findAllByApplicationIdsWithoutPermission(List<String> applicationIds, List<String> includeFields);

    List<NewAction> findAllByCollectionIds(
            List<String> collectionIds, boolean viewMode, AclPermission permission, User currentUser);

    List<NewAction> findAllUnpublishedActionsByContextIdAndContextType(
            String contextId,
            CreatorContextType contextType,
            AclPermission permission,
            User currentUser,
            boolean includeJs);

    List<NewAction> findAllPublishedActionsByContextIdAndContextType(
            String contextId,
            CreatorContextType contextType,
            AclPermission permission,
            User currentUser,
            boolean includeJs);

    List<NewAction> findAllByApplicationIds(List<String> branchedArtifactIds, List<String> includedFields);

    List<IdPoliciesOnly> findIdsAndPolicyMapByApplicationIdIn(List<String> applicationIds);
}
