package com.appsmith.server.repositories;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.ActionCollection;
import org.springframework.data.domain.Sort;
import reactor.core.publisher.Flux;

import java.util.List;

public interface CustomActionCollectionRepository extends AppsmithRepository<ActionCollection> {

    Flux<ActionCollection> findByApplicationId(String applicationId, AclPermission aclPermission, Sort sort);

    Flux<ActionCollection> findByApplicationIdAndViewMode(String applicationId, boolean viewMode, AclPermission aclPermission);

    Flux<ActionCollection> findAllActionCollectionsByNameAndPageIdsAndViewMode(String name, List<String> pageIds, boolean viewMode, AclPermission aclPermission, Sort sort);
}
