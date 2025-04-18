package com.appsmith.server.repositories.ce;

import com.appsmith.external.models.CreatorContextType;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.NewAction;
import com.appsmith.server.dtos.PluginTypeAndCountDTO;
import com.appsmith.server.repositories.AppsmithRepository;
import org.springframework.data.domain.Sort;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.Optional;
import java.util.Set;

public interface CustomNewActionRepositoryCE extends AppsmithRepository<NewAction> {

    Flux<NewAction> findByApplicationId(String applicationId, AclPermission aclPermission);

    Mono<NewAction> findByUnpublishedNameAndPageId(String name, String pageId, AclPermission aclPermission);

    Flux<NewAction> findByPageId(String pageId, AclPermission aclPermission);

    Flux<NewAction> findByPageId(String pageId, Optional<AclPermission> aclPermission);

    Flux<NewAction> findByPageId(String pageId);

    Flux<NewAction> findByPageIdAndViewMode(String pageId, Boolean viewMode, AclPermission aclPermission);

    Flux<NewAction> findUnpublishedActionsByNameInAndPageId(Set<String> names, String pageId, AclPermission permission);

    Flux<NewAction> findUnpublishedActionsByPageIdAndExecuteOnLoadSetByUserTrue(
            String pageId, AclPermission permission);

    Flux<NewAction> findAllActionsByNameAndPageIdsAndViewMode(
            String name, List<String> pageIds, Boolean viewMode, AclPermission aclPermission, Sort sort);

    Flux<NewAction> findByApplicationId(String applicationId, AclPermission aclPermission, Sort sort);

    Flux<NewAction> findPublishedActionsByPageIdAndExcludedPluginType(
            String pageId, List<String> pluginTypes, AclPermission aclPermission, Sort sort);

    Flux<NewAction> findPublishedActionsByAppIdAndExcludedPluginType(
            String appId, List<String> pluginTypes, AclPermission aclPermission, Sort sort);

    Flux<NewAction> findByApplicationId(
            String applicationId, Optional<AclPermission> aclPermission, Optional<Sort> sort);

    Flux<NewAction> findByApplicationIdAndViewMode(String applicationId, Boolean viewMode, AclPermission aclPermission);

    Mono<Long> countByDatasourceId(String datasourceId);

    Flux<NewAction> findUnpublishedActionsByDatasourceId(String datasourceId);

    Flux<NewAction> findByPageIds(List<String> pageIds, AclPermission permission);

    Flux<NewAction> findByPageIds(List<String> pageIds, Optional<AclPermission> permission);

    Flux<NewAction> findNonJsActionsByApplicationIdAndViewMode(
            String applicationId, Boolean viewMode, AclPermission aclPermission);

    Flux<NewAction> findAllNonJsActionsByNameAndPageIdsAndViewMode(
            String name, List<String> pageIds, Boolean viewMode, AclPermission aclPermission, Sort sort);

    Mono<Void> publishActions(String applicationId, AclPermission permission);

    Mono<Integer> archiveDeletedUnpublishedActions(String applicationId, AclPermission permission);

    Flux<PluginTypeAndCountDTO> countActionsByPluginType(String applicationId);

    Flux<NewAction> findAllByApplicationIdsWithoutPermission(List<String> applicationIds, List<String> includeFields);

    Flux<NewAction> findAllByCollectionIds(List<String> collectionIds, boolean viewMode, AclPermission aclPermission);

    Flux<NewAction> findAllUnpublishedActionsByContextIdAndContextType(
            String contextId, CreatorContextType contextType, AclPermission permission, boolean includeJs);

    Flux<NewAction> findAllPublishedActionsByContextIdAndContextType(
            String contextId, CreatorContextType contextType, AclPermission permission, boolean includeJs);

    Flux<NewAction> findAllByApplicationIds(List<String> branchedArtifactIds, List<String> includedFields);

    // @Meta(cursorBatchSize = 10000)
    // TODO Implement cursor with batch size
    Flux<NewAction> findByApplicationId(String applicationId);

    // @Meta(cursorBatchSize = 10000)
    // TODO Implement cursor with batch size
    Flux<NewAction> findAllByIdIn(Iterable<String> ids);

    Mono<Long> countByDeletedAtNull();
}
