package com.appsmith.server.repositories.ce;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.Action;
import com.appsmith.server.repositories.AppsmithRepository;
import org.springframework.data.domain.Sort;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.Set;

public interface CustomActionRepositoryCE extends AppsmithRepository<Action> {

    Mono<Action> findByNameAndPageId(String name, String pageId, AclPermission aclPermission);

    Flux<Action> findByPageId(String pageId, AclPermission aclPermission);

    Flux<Action> findActionsByNameInAndPageIdAndActionConfiguration_HttpMethod(Set<String> names,
                                                                               String pageId,
                                                                               String httpMethod,
                                                                               AclPermission aclPermission);

    Flux<Action> findAllActionsByNameAndPageIds(String name, List<String> pageIds, AclPermission aclPermission, Sort sort);
}
