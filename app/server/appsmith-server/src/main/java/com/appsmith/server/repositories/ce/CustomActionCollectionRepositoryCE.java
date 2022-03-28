package com.appsmith.server.repositories.ce;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.ActionCollection;
import com.appsmith.server.repositories.AppsmithRepository;
import org.springframework.data.domain.Sort;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.List;

public interface CustomActionCollectionRepositoryCE extends AppsmithRepository<ActionCollection> {

    Flux<ActionCollection> findByApplicationId(String applicationId, AclPermission aclPermission, Sort sort);

    Flux<ActionCollection> findByApplicationIdAndViewMode(String applicationId, boolean viewMode, AclPermission aclPermission);

    Flux<ActionCollection> findAllActionCollectionsByNamePageIdsViewModeAndBranch(String name, List<String> pageIds, boolean viewMode, String branchName, AclPermission aclPermission, Sort sort);

    Flux<ActionCollection> findByPageId(String pageId, AclPermission permission);

    Flux<ActionCollection> findByPageId(String pageId);

    Mono<ActionCollection> findByBranchNameAndDefaultCollectionId(String branchName, String defaultCollectionId, AclPermission permission);

}
