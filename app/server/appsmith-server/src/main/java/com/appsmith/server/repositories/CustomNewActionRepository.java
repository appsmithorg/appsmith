package com.appsmith.server.repositories;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.NewAction;
import org.springframework.data.domain.Sort;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.Set;

public interface CustomNewActionRepository extends AppsmithRepository<NewAction> {
    Flux<NewAction> findByApplicationId(String applicationId, AclPermission aclPermission);

    Mono<NewAction> findByUnpublishedNameAndPageId(String name, String pageId, AclPermission aclPermission);

    Flux<NewAction> findByPageId(String pageId, AclPermission aclPermission);

    Flux<NewAction> findByPageId(String pageId);

    Flux<NewAction> findByPageIdAndViewMode(String pageId, Boolean viewMode, AclPermission aclPermission);

    Flux<NewAction> findUnpublishedActionsByNameInAndPageId(Set<String> names, String pageId, AclPermission permission);

    Flux<NewAction> findUnpublishedActionsByPageIdAndExecuteOnLoadSetByUserTrue(String pageId, AclPermission permission);

    Flux<NewAction> findUnpublishedActionsForRestApiOnLoad(Set<String> names,
                                                           String pageId,
                                                           String httpMethod,
                                                           Boolean userSetOnLoad, AclPermission aclPermission);

    Flux<NewAction> findAllActionsByNameAndPageIdsAndViewMode(String name, List<String> pageIds, Boolean viewMode, AclPermission aclPermission, Sort sort);

    Flux<NewAction> findUnpublishedActionsByNameInAndPageIdAndExecuteOnLoadTrue(
            Set<String> names, String pageId, AclPermission permission);

    Flux<NewAction> findByApplicationId(String applicationId, AclPermission aclPermission, Sort sort);

    Flux<NewAction> findByApplicationIdAndViewMode(String applicationId, Boolean viewMode, AclPermission aclPermission);

    Mono<Long> countByDatasourceId(String datasourceId);
}
