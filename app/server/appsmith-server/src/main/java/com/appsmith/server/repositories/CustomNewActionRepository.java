package com.appsmith.server.repositories;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.NewAction;
import org.springframework.data.domain.Sort;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.Set;

public interface CustomNewActionRepository extends AppsmithRepository<NewAction> {
    Mono<NewAction> findByNameAndPageId(String name, String pageId, AclPermission aclPermission);

    Flux<NewAction> findByPageId(String pageId, AclPermission aclPermission);

    Flux<NewAction> findActionsByNameInAndPageIdAndActionConfiguration_HttpMethod(Set<String> names,
                                                                               String pageId,
                                                                               String httpMethod,
                                                                               AclPermission aclPermission);

    Flux<NewAction> findAllActionsByNameAndPageIds(String name, List<String> pageIds, AclPermission aclPermission, Sort sort);
}
