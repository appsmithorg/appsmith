package com.appsmith.server.repositories.ce;

import com.appsmith.external.models.CreatorContextType;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.NewAction;
import com.appsmith.server.repositories.AppsmithRepository;
import org.springframework.data.domain.Sort;

import java.util.List;
import java.util.Optional;
import java.util.Set;

public interface CustomNewActionRepositoryCE extends AppsmithRepository<NewAction> {

    List<NewAction> findByApplicationId(String applicationId, AclPermission aclPermission);

    Optional<NewAction> findByUnpublishedNameAndPageId(String name, String pageId, AclPermission aclPermission);

    List<NewAction> findByPageId(String pageId, AclPermission aclPermission);

    List<NewAction> findByPageId(String pageId);

    List<NewAction> findByPageIdAndViewMode(String pageId, Boolean viewMode, AclPermission aclPermission);

    List<NewAction> findUnpublishedActionsByNameInAndPageId(Set<String> names, String pageId, AclPermission permission);

    List<NewAction> findUnpublishedActionsByPageIdAndExecuteOnLoadSetByUserTrue(
            String pageId, AclPermission permission);

    List<NewAction> findAllActionsByNameAndPageIdsAndViewMode(
            String name, List<String> pageIds, Boolean viewMode, AclPermission aclPermission, Sort sort);

    List<NewAction> findByApplicationId(String applicationId, AclPermission aclPermission, Sort sort);

    List<NewAction> findByApplicationId(String applicationId, AclPermission aclPermission, Optional<Sort> sort);

    List<NewAction> findByApplicationIdAndViewMode(String applicationId, Boolean viewMode, AclPermission aclPermission);

    Optional<Long> countByDatasourceId(String datasourceId);

    Optional<NewAction> findByBranchNameAndDefaultActionId(
            String branchName, String defaultActionId, Boolean viewMode, AclPermission permission);

    List<NewAction> findByDefaultApplicationId(String defaultApplicationId, AclPermission permission);

    List<NewAction> findByPageIds(List<String> pageIds, AclPermission permission);

    List<NewAction> findNonJsActionsByApplicationIdAndViewMode(
        String applicationId, Boolean viewMode, AclPermission aclPermission);

    List<NewAction> findAllNonJsActionsByNameAndPageIdsAndViewMode(
            String name, List<String> pageIds, Boolean viewMode, AclPermission aclPermission, Sort sort);

    Optional<Void> publishActions(String applicationId, AclPermission permission);

    Optional<Integer> archiveDeletedUnpublishedActions(String applicationId, AclPermission permission);

    List<NewAction> findAllByApplicationIdsWithoutPermission(List<String> applicationIds, List<String> includeFields);

    List<NewAction> findAllByCollectionIds(List<String> collectionIds, boolean viewMode, AclPermission aclPermission);

    List<NewAction> findAllUnpublishedActionsByContextIdAndContextType(
            String contextId, CreatorContextType contextType, AclPermission permission, boolean includeJs);

    List<NewAction> findAllPublishedActionsByContextIdAndContextType(
            String contextId, CreatorContextType contextType, AclPermission permission, boolean includeJs);
}
