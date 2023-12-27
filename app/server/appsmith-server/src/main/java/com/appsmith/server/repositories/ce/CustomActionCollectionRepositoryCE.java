package com.appsmith.server.repositories.ce;

import com.appsmith.external.models.CreatorContextType;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.ActionCollection;
import com.appsmith.server.repositories.AppsmithRepository;
import com.mongodb.bulk.BulkWriteResult;
import org.springframework.data.domain.Sort;

import java.util.List;
import java.util.Optional;

public interface CustomActionCollectionRepositoryCE extends AppsmithRepository<ActionCollection> {

    List<ActionCollection> findByApplicationId(String applicationId, AclPermission aclPermission, Sort sort);

    List<ActionCollection> findByApplicationId(
            String applicationId, Optional<AclPermission> aclPermission, Optional<Sort> sort);

    List<ActionCollection> findByApplicationIdAndViewMode(
            String applicationId, boolean viewMode, AclPermission aclPermission);

    List<ActionCollection> findAllActionCollectionsByNameDefaultPageIdsViewModeAndBranch(
            String name,
            List<String> pageIds,
            boolean viewMode,
            String branchName,
            AclPermission aclPermission,
            Sort sort);

    List<ActionCollection> findByPageId(String pageId, AclPermission permission);

    List<ActionCollection> findByPageId(String pageId);

    Optional<ActionCollection> findByBranchNameAndDefaultCollectionId(
            String branchName, String defaultCollectionId, AclPermission permission);

    Optional<ActionCollection> findByGitSyncIdAndDefaultApplicationId(
            String defaultApplicationId, String gitSyncId, AclPermission permission);

    List<ActionCollection> findByDefaultApplicationId(String defaultApplicationId, Optional<AclPermission> permission);

    Optional<ActionCollection> findByGitSyncIdAndDefaultApplicationId(
            String defaultApplicationId, String gitSyncId, Optional<AclPermission> permission);

    List<ActionCollection> findByPageIds(List<String> pageIds, AclPermission permission);

    List<ActionCollection> findByPageIds(List<String> pageIds, Optional<AclPermission> permission);

    Optional<List<BulkWriteResult>> bulkUpdate(List<ActionCollection> actionCollections);

    List<ActionCollection> findAllByApplicationIds(List<String> applicationIds, List<String> includeFields);

    List<ActionCollection> findAllUnpublishedActionCollectionsByContextIdAndContextType(
            String contextId, CreatorContextType contextType, AclPermission permission);

    List<ActionCollection> findAllPublishedActionCollectionsByContextIdAndContextType(
            String contextId, CreatorContextType contextType, AclPermission permission);
}
