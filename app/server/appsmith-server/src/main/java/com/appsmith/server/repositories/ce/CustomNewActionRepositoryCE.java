package com.appsmith.server.repositories.ce;

import com.appsmith.external.models.CreatorContextType;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.Action;
import com.appsmith.server.dtos.PluginTypeAndCountDTO;
import com.appsmith.server.repositories.AppsmithRepository;
import com.mongodb.client.result.UpdateResult;
import org.springframework.data.domain.Sort;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.Optional;
import java.util.Set;

public interface CustomNewActionRepositoryCE extends AppsmithRepository<Action> {

    Flux<Action> findByApplicationId(String applicationId, AclPermission aclPermission);

    Mono<Action> findByUnpublishedNameAndPageId(String name, String pageId, AclPermission aclPermission);

    Flux<Action> findByPageId(String pageId, AclPermission aclPermission);

    Flux<Action> findByPageId(String pageId, Optional<AclPermission> aclPermission);

    Flux<Action> findByPageId(String pageId);

    Flux<Action> findByPageIdAndViewMode(String pageId, Boolean viewMode, AclPermission aclPermission);

    Flux<Action> findUnpublishedActionsByNameInAndPageId(Set<String> names, String pageId, AclPermission permission);

    Flux<Action> findUnpublishedActionsByPageIdAndExecuteOnLoadSetByUserTrue(String pageId, AclPermission permission);

    Flux<Action> findUnpublishedActionsForRestApiOnLoad(
            Set<String> names, String pageId, String httpMethod, Boolean userSetOnLoad, AclPermission aclPermission);

    Flux<Action> findAllActionsByNameAndPageIdsAndViewMode(
            String name, List<String> pageIds, Boolean viewMode, AclPermission aclPermission, Sort sort);

    Flux<Action> findUnpublishedActionsByNameInAndPageIdAndExecuteOnLoadTrue(
            Set<String> names, String pageId, AclPermission permission);

    Flux<Action> findByApplicationId(String applicationId, AclPermission aclPermission, Sort sort);

    Flux<Action> findByApplicationId(String applicationId, Optional<AclPermission> aclPermission, Optional<Sort> sort);

    Flux<Action> findByApplicationIdAndViewMode(String applicationId, Boolean viewMode, AclPermission aclPermission);

    Mono<Long> countByDatasourceId(String datasourceId);

    Mono<Action> findByBranchNameAndDefaultActionId(
            String branchName, String defaultActionId, AclPermission permission);

    Mono<Action> findByGitSyncIdAndDefaultApplicationId(
            String defaultApplicationId, String gitSyncId, AclPermission permission);

    Flux<Action> findByDefaultApplicationId(String defaultApplicationId, Optional<AclPermission> permission);

    Mono<Action> findByGitSyncIdAndDefaultApplicationId(
            String defaultApplicationId, String gitSyncId, Optional<AclPermission> permission);

    Flux<Action> findByPageIds(List<String> pageIds, AclPermission permission);

    Flux<Action> findByPageIds(List<String> pageIds, Optional<AclPermission> permission);

    Flux<Action> findNonJsActionsByApplicationIdAndViewMode(
            String applicationId, Boolean viewMode, AclPermission aclPermission);

    Flux<Action> findAllNonJsActionsByNameAndPageIdsAndViewMode(
            String name, List<String> pageIds, Boolean viewMode, AclPermission aclPermission, Sort sort);

    Mono<Void> publishActions(String applicationId, AclPermission permission);

    Mono<UpdateResult> archiveDeletedUnpublishedActions(String applicationId, AclPermission permission);

    Flux<PluginTypeAndCountDTO> countActionsByPluginType(String applicationId);

    Flux<Action> findAllByApplicationIdsWithoutPermission(List<String> applicationIds, List<String> includeFields);

    Flux<Action> findAllUnpublishedActionsByContextIdAndContextType(
            String contextId, CreatorContextType contextType, AclPermission permission, boolean includeJs);

    Flux<Action> findAllPublishedActionsByContextIdAndContextType(
            String contextId, CreatorContextType contextType, AclPermission permission, boolean includeJs);
}
