package com.appsmith.server.repositories;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.Action;
import org.springframework.data.domain.Sort;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.Set;

public interface CustomActionRepository extends AppsmithRepository<Action> {

    Mono<Action> findByNameAndPageId(String name, String pageId, AclPermission aclPermission);

    Flux<Action> findByPageId(String pageId, AclPermission aclPermission);

    Flux<Action> findDistinctActionsByNameInAndPageIdAndActionConfiguration_HttpMethod(Set<String> names,
                                                                                       String pageId,
                                                                                       String httpMethod,
                                                                                       AclPermission aclPermission);

    Flux<Action> findAllActionsByNameAndPageIds(String name, List<String> pageIds, AclPermission aclPermission, Sort sort);
}
