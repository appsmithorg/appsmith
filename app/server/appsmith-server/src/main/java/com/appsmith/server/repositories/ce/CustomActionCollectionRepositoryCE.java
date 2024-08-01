package com.appsmith.server.repositories.ce;

import com.appsmith.external.models.CreatorContextType;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.ActionCollection;
import com.appsmith.server.repositories.AppsmithRepository;
import org.springframework.data.domain.Sort;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.Optional;

public interface CustomActionCollectionRepositoryCE extends AppsmithRepository<ActionCollection> {

    Flux<ActionCollection> findByApplicationId(String applicationId, AclPermission aclPermission, Sort sort);

    Flux<ActionCollection> findByApplicationId(
            String applicationId, Optional<AclPermission> aclPermission, Optional<Sort> sort);

    Flux<ActionCollection> findNonComposedByApplicationIdAndViewMode(
            String applicationId, boolean viewMode, AclPermission aclPermission);

    Flux<ActionCollection> findByPageId(String pageId, AclPermission permission);

    Flux<ActionCollection> findByPageId(String pageId);

    Mono<ActionCollection> findByBranchNameAndBaseCollectionId(
            String branchName, String baseCollectionId, AclPermission permission);

    Flux<ActionCollection> findByPageIds(List<String> pageIds, AclPermission permission);

    Flux<ActionCollection> findAllByApplicationIds(List<String> applicationIds, List<String> includeFields);

    Flux<ActionCollection> findAllUnpublishedActionCollectionsByContextIdAndContextType(
            String contextId, CreatorContextType contextType, AclPermission permission);

    Flux<ActionCollection> findAllPublishedActionCollectionsByContextIdAndContextType(
            String contextId, CreatorContextType contextType, AclPermission permission);

    Flux<ActionCollection> findByPageIdAndViewMode(String pageId, boolean viewMode, AclPermission permission);

    Flux<ActionCollection> findAllNonComposedByPageIdAndViewMode(
            String pageId, boolean viewMode, AclPermission permission);
}
