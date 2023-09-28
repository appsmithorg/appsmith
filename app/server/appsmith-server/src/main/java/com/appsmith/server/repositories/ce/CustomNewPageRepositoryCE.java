package com.appsmith.server.repositories.ce;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.NewPage;
import com.appsmith.server.repositories.AppsmithRepository;
import com.mongodb.bulk.BulkWriteResult;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface CustomNewPageRepositoryCE extends AppsmithRepository<NewPage> {

    @Deprecated
    Flux<NewPage> findByApplicationId(String applicationId, AclPermission aclPermission);

    Flux<NewPage> findByApplicationId(String applicationId, Optional<AclPermission> permission);

    Flux<NewPage> findByApplicationIdAndNonDeletedEditMode(String applicationId, AclPermission aclPermission);

    Mono<NewPage> findByIdAndLayoutsIdAndViewMode(
            String id, String layoutId, AclPermission aclPermission, Boolean viewMode);

    Mono<NewPage> findByNameAndViewMode(String name, AclPermission aclPermission, Boolean viewMode);

    Mono<NewPage> findByNameAndApplicationIdAndViewMode(
            String name, String applicationId, AclPermission aclPermission, Boolean viewMode);

    Flux<NewPage> findAllPageDTOsByIds(List<String> ids, AclPermission aclPermission);

    Mono<String> getNameByPageId(String pageId, boolean isPublishedName);

    Mono<NewPage> findPageByBranchNameAndDefaultPageId(
            String branchName, String defaultPageId, AclPermission permission);

    Flux<NewPage> findSlugsByApplicationIds(List<String> applicationIds, AclPermission aclPermission);

    Mono<NewPage> findByGitSyncIdAndDefaultApplicationId(
            String defaultApplicationId, String gitSyncId, AclPermission permission);

    Mono<NewPage> findByGitSyncIdAndDefaultApplicationId(
            String defaultApplicationId, String gitSyncId, Optional<AclPermission> permission);

    Mono<List<BulkWriteResult>> publishPages(Collection<String> pageIds, AclPermission permission);

    Mono<List<BulkWriteResult>> bulkUpdate(List<NewPage> newPages);

    Flux<NewPage> findAllByApplicationIdsWithoutPermission(List<String> applicationIds, List<String> includeFields);
}
