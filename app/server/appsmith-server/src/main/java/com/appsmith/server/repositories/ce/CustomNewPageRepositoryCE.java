package com.appsmith.server.repositories.ce;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.NewPage;
import com.appsmith.server.newpages.projections.PageViewWithoutDSL;
import com.appsmith.server.repositories.AppsmithRepository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.Collection;
import java.util.List;
import java.util.Map;

public interface CustomNewPageRepositoryCE extends AppsmithRepository<NewPage> {

    Mono<NewPage> findById(String id, AclPermission permission, List<String> projectedFields);

    Flux<NewPage> findByApplicationId(String applicationId, AclPermission aclPermission);

    <T> Flux<T> findByApplicationId(String applicationId, AclPermission aclPermission, Class<T> projectionClass);

    Flux<NewPage> findByApplicationIdAndNonDeletedEditMode(String applicationId, AclPermission aclPermission);

    Mono<NewPage> findByIdAndLayoutsIdAndViewMode(
            String id, String layoutId, AclPermission aclPermission, Boolean viewMode);

    Mono<NewPage> findByNameAndViewMode(String name, AclPermission aclPermission, Boolean viewMode);

    Mono<NewPage> findByNameAndApplicationIdAndViewMode(
            String name, String applicationId, AclPermission aclPermission, Boolean viewMode);

    Flux<PageViewWithoutDSL> findAllPageDTOsByIds(List<String> ids, AclPermission aclPermission);

    Mono<String> getNameByPageId(String pageId, boolean isPublishedName);

    Mono<NewPage> findPageByBranchNameAndBasePageId(
            String branchName, String basePageId, AclPermission permission, List<String> projectedFieldNames);

    Flux<NewPage> findAllByApplicationIds(List<String> branchedArtifactIds, List<String> includedFields);

    Mono<Void> publishPages(Collection<String> pageIds, AclPermission permission);

    Flux<NewPage> findAllByApplicationIdsWithoutPermission(List<String> applicationIds, List<String> includeFields);

    Mono<Integer> updateDependencyMap(String pageId, Map<String, List<String>> dependencyMap);
}
