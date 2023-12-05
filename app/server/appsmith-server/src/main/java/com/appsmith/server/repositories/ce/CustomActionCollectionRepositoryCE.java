package com.appsmith.server.repositories.ce;

import com.appsmith.external.models.CreatorContextType;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.ActionCollection;
import com.appsmith.server.repositories.AppsmithRepository;
import com.mongodb.bulk.BulkWriteResult;
import com.mongodb.client.result.InsertManyResult;
import org.springframework.data.domain.Sort;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.Optional;

public interface CustomActionCollectionRepositoryCE extends AppsmithRepository<ActionCollection> {

    Flux<ActionCollection> findByApplicationId(String applicationId, AclPermission aclPermission, Sort sort);

    Flux<ActionCollection> findByApplicationId(
            String applicationId, Optional<AclPermission> aclPermission, Optional<Sort> sort);

    Flux<ActionCollection> findByApplicationIdAndViewMode(
            String applicationId, boolean viewMode, AclPermission aclPermission);

    Flux<ActionCollection> findAllActionCollectionsByNameDefaultPageIdsViewModeAndBranch(
            String name,
            List<String> pageIds,
            boolean viewMode,
            String branchName,
            AclPermission aclPermission,
            Sort sort);

    Flux<ActionCollection> findByPageId(String pageId, AclPermission permission);

    Flux<ActionCollection> findByPageId(String pageId);

    Mono<ActionCollection> findByBranchNameAndDefaultCollectionId(
            String branchName, String defaultCollectionId, AclPermission permission);

    Mono<ActionCollection> findByGitSyncIdAndDefaultApplicationId(
            String defaultApplicationId, String gitSyncId, AclPermission permission);

    Flux<ActionCollection> findByDefaultApplicationId(String defaultApplicationId, Optional<AclPermission> permission);

    Mono<ActionCollection> findByGitSyncIdAndDefaultApplicationId(
            String defaultApplicationId, String gitSyncId, Optional<AclPermission> permission);

    Flux<ActionCollection> findByListOfPageIds(List<String> pageIds, AclPermission permission);

    Flux<ActionCollection> findByListOfPageIds(List<String> pageIds, Optional<AclPermission> permission);

    Mono<List<InsertManyResult>> bulkInsert(List<ActionCollection> newActions);

    Mono<List<BulkWriteResult>> bulkUpdate(List<ActionCollection> actionCollections);

    Flux<ActionCollection> findAllByApplicationIds(List<String> applicationIds, List<String> includeFields);

    Flux<ActionCollection> findAllUnpublishedActionCollectionsByContextIdAndContextType(
            String contextId, CreatorContextType contextType, AclPermission permission);

    Flux<ActionCollection> findAllPublishedActionCollectionsByContextIdAndContextType(
            String contextId, CreatorContextType contextType, AclPermission permission);
}
