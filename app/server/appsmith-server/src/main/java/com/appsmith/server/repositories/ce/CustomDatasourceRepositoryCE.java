package com.appsmith.server.repositories.ce;

import com.appsmith.external.models.Datasource;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.repositories.AppsmithRepository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.Map;
import java.util.Set;

public interface CustomDatasourceRepositoryCE extends AppsmithRepository<Datasource> {

    Flux<Datasource> findAllByWorkspaceId(String workspaceId, AclPermission permission);

    Mono<Datasource> findByNameAndWorkspaceId(String name, String workspaceId, AclPermission aclPermission);

    Flux<Datasource> findByIdIn(List<String> ids);

    Flux<Datasource> findAllByIds(List<String> ids, AclPermission permission);

    Mono<Long> countByDeletedAtNull();

    /**
     * Counts datasources that are not deleted, grouped by {@code pluginId}, for support diagnostics. A datasource with
     * no plugin ID is counted under the empty string.
     *
     * <p>No ACL. Call only behind the super-user check in {@code SupportDiagnosticsServiceCEImpl}.
     */
    Mono<Map<String, Long>> countByPluginIdForDiagnostics();

    /**
     * Counts the datasources in {@code datasourceIds} that are not deleted, grouped by {@code pluginId}, for support
     * diagnostics. IDs that are not valid object IDs are ignored. An empty set returns an empty map without a query.
     *
     * <p>No ACL. Call only behind the super-user check in {@code SupportDiagnosticsServiceCEImpl}.
     */
    Mono<Map<String, Long>> countByPluginIdForDiagnostics(Set<String> datasourceIds);
}
