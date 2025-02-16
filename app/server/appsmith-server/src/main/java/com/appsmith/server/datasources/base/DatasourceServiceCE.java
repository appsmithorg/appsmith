package com.appsmith.server.datasources.base;

import com.appsmith.external.models.Datasource;
import com.appsmith.external.models.DatasourceStorage;
import com.appsmith.external.models.DatasourceStorageDTO;
import com.appsmith.external.models.DatasourceTestResult;
import com.appsmith.external.models.MustacheBindingToken;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.dtos.DBOpsType;
import org.springframework.util.MultiValueMap;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.Map;
import java.util.Set;

public interface DatasourceServiceCE {

    Mono<Datasource> validateDatasource(Datasource datasource);

    /**
     * @param datasourceStorageDTO - The datasourceStorageDTO which is about to be tested
     * @param activeEnvironmentId  - environmentId, name of the environment on which the datasource is getting tested,
     *                             this variable is unused in the CE version of the code.
     * @return Mono<DatasourceTestResult> - result whether the datasource secures a valid connection with the remote DB
     */
    Mono<DatasourceTestResult> testDatasource(DatasourceStorageDTO datasourceStorageDTO, String activeEnvironmentId);

    Mono<Datasource> findByNameAndWorkspaceId(String name, String workspaceId, AclPermission permission);

    Mono<Datasource> findById(String id, AclPermission aclPermission);

    Mono<Datasource> findByIdWithStorages(String id);

    Mono<Datasource> findByIdAndEnvironmentId(String id, String environmentId);

    Mono<Datasource> findById(String id);

    Mono<Set<MustacheBindingToken>> extractKeysFromDatasource(Datasource datasource);

    Mono<Datasource> save(Datasource datasource, boolean isDryOps);

    /**
     * Retrieves all datasources based on input params, currently only workspaceId.
     * The retrieved datasources will contain configuration from the default environment,
     * for compatibility.
     *
     * @param params
     * @return A flux of DatsourceDTO, which will change after API contracts gets updated
     */
    Flux<Datasource> getAllWithStorages(MultiValueMap<String, String> params);

    /**
     * Retrieves all datasources based on workspaceId. The retrieved datasources will contain
     * configurations from all environments.
     *
     * @param workspaceId
     * @param permission  In case permissions are absent, the DB query disregards GAC rules
     * @return
     */
    Flux<Datasource> getAllByWorkspaceIdWithStorages(String workspaceId, AclPermission permission);

    Flux<Datasource> saveAll(List<Datasource> datasourceList);

    Mono<Datasource> create(Datasource datasource);

    Mono<Datasource> createWithoutPermissions(Datasource datasource);

    Mono<Datasource> createWithoutPermissions(
            Datasource datasource, Map<DBOpsType, List<DatasourceStorage>> datasourceStorageDryRunQueries);

    Mono<Datasource> updateDatasourceStorage(
            DatasourceStorageDTO datasourceStorageDTO, String activeEnvironmentId, Boolean IsUserRefreshedUpdate);

    Mono<Datasource> updateDatasource(
            String id, Datasource datasource, String activeEnvironmentId, Boolean isUserRefreshedUpdate);

    Mono<Datasource> archiveById(String id);

    /**
     * If we are trying to get environment id with respect to a particular plugin,
     * we use this method to check out of scope plugins first
     *
     * @param workspaceId
     * @param environmentId
     * @param pluginId
     * @param aclPermission
     * @return
     */
    Mono<String> getTrueEnvironmentId(
            String workspaceId, String environmentId, String pluginId, AclPermission aclPermission);

    Mono<String> getTrueEnvironmentId(
            String workspaceId, String environmentId, String pluginId, AclPermission aclPermission, boolean isEmbedded);

    Datasource createDatasourceFromDatasourceStorage(DatasourceStorage datasourceStorage);

    Mono<String> getRateLimitIdentifier(DatasourceStorage datasourceStorage);

    Mono<Boolean> isEndpointBlockedForConnectionRequest(DatasourceStorage datasourceStorage);

    Mono<Boolean> consumeTokenIfAvailable(DatasourceStorage datasourceStorage);

    Mono<Boolean> blockEndpointForConnectionRequest(DatasourceStorage datasourceStorage);

    Mono<Integer> executeDatasourceImport(
            String artifactId,
            String workspaceId,
            String pluginMap,
            String importedDatasources,
            String decryptedFields);
}
