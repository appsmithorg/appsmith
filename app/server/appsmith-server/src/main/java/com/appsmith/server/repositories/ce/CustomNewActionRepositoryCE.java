package com.appsmith.server.repositories.ce;

import com.appsmith.external.models.CreatorContextType;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.NewAction;
import com.appsmith.server.dtos.PluginTypeAndCountDTO;
import com.appsmith.server.repositories.AppsmithRepository;
import com.mongodb.bulk.BulkWriteResult;
import com.mongodb.client.result.InsertManyResult;
import com.mongodb.client.result.UpdateResult;
import org.springframework.data.domain.Sort;

import java.util.List;
import java.util.Optional;
import java.util.Set;

public interface CustomNewActionRepositoryCE extends AppsmithRepository<NewAction> {

    List<NewAction> findByApplicationId(String applicationId, AclPermission aclPermission);

    Optional<NewAction> findByUnpublishedNameAndPageId(String name, String pageId, AclPermission aclPermission);

    List<NewAction> findByPageId(String pageId, AclPermission aclPermission);

    List<NewAction> findByPageId(String pageId, Optional<AclPermission> aclPermission);

    List<NewAction> findByPageId(String pageId);

    List<NewAction> findByPageIdAndViewMode(String pageId, Boolean viewMode, AclPermission aclPermission);

    List<NewAction> findUnpublishedActionsByNameInAndPageId(Set<String> names, String pageId, AclPermission permission);

    List<NewAction> findUnpublishedActionsByPageIdAndExecuteOnLoadSetByUserTrue(
            String pageId, AclPermission permission);

    List<NewAction> findUnpublishedActionsForRestApiOnLoad(
            Set<String> names, String pageId, String httpMethod, Boolean userSetOnLoad, AclPermission aclPermission);

    List<NewAction> findAllActionsByNameAndPageIdsAndViewMode(
            String name, List<String> pageIds, Boolean viewMode, AclPermission aclPermission, Sort sort);

    List<NewAction> findUnpublishedActionsByNameInAndPageIdAndExecuteOnLoadTrue(
            Set<String> names, String pageId, AclPermission permission);

    List<NewAction> findByApplicationId(String applicationId, AclPermission aclPermission, Sort sort);

    List<NewAction> findByApplicationId(
            String applicationId, Optional<AclPermission> aclPermission, Optional<Sort> sort);

    List<NewAction> findByApplicationIdAndViewMode(String applicationId, Boolean viewMode, AclPermission aclPermission);

    Optional<Long> countByDatasourceId(String datasourceId);

    Optional<NewAction> findByBranchNameAndDefaultActionId(
            String branchName, String defaultActionId, AclPermission permission);

    Optional<NewAction> findByGitSyncIdAndDefaultApplicationId(
            String defaultApplicationId, String gitSyncId, AclPermission permission);

    List<NewAction> findByDefaultApplicationId(String defaultApplicationId, Optional<AclPermission> permission);

    Optional<NewAction> findByGitSyncIdAndDefaultApplicationId(
            String defaultApplicationId, String gitSyncId, Optional<AclPermission> permission);

    List<NewAction> findByPageIds(List<String> pageIds, AclPermission permission);

    List<NewAction> findByPageIds(List<String> pageIds, Optional<AclPermission> permission);

    List<NewAction> findNonJsActionsByApplicationIdAndViewMode(
            String applicationId, Boolean viewMode, AclPermission aclPermission);

    List<NewAction> findAllNonJsActionsByNameAndPageIdsAndViewMode(
            String name, List<String> pageIds, Boolean viewMode, AclPermission aclPermission, Sort sort);

    Optional<List<InsertManyResult>> bulkInsert(List<NewAction> newActions);

    Optional<List<BulkWriteResult>> bulkUpdate(List<NewAction> newActions);

    Optional<List<BulkWriteResult>> publishActions(String applicationId, AclPermission permission);

    Optional<UpdateResult> archiveDeletedUnpublishedActions(String applicationId, AclPermission permission);

    List<PluginTypeAndCountDTO> countActionsByPluginType(String applicationId);

    List<NewAction> findAllByApplicationIdsWithoutPermission(List<String> applicationIds, List<String> includeFields);

    List<NewAction> findAllUnpublishedActionsByContextIdAndContextType(
            String contextId, CreatorContextType contextType, AclPermission permission, boolean includeJs);

    List<NewAction> findAllPublishedActionsByContextIdAndContextType(
            String contextId, CreatorContextType contextType, AclPermission permission, boolean includeJs);
}
