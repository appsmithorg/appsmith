package com.appsmith.server.services.ce;

import com.appsmith.external.models.Datasource;
import com.appsmith.external.models.DatasourceDTO;
import com.appsmith.external.models.DatasourceTestResult;
import com.appsmith.external.models.MustacheBindingToken;
import com.appsmith.server.acl.AclPermission;
import org.springframework.util.MultiValueMap;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;

public interface DatasourceServiceCE {

    Mono<Datasource> validateDatasource(Datasource datasource);

    /**
     * @param datasource    - The datasource which is about to be tested
     * @param environmentId - environmentName, name of the environment on which the datasource is getting tested,
     *                      this variable is unused in the CE version of the code.
     * @return Mono<DatasourceTestResult> - result whether the datasource secures a valid connection with the remote DB
     */
    Mono<DatasourceTestResult> testDatasource(Datasource datasource, String environmentId);

    Mono<Datasource> findByNameAndWorkspaceId(String name, String workspaceId, AclPermission permission);

    Mono<Datasource> findByNameAndWorkspaceId(String name, String workspaceId, Optional<AclPermission> permission);

    Mono<Datasource> findById(String id, AclPermission aclPermission);

    Mono<Datasource> findByIdWithStorages(String id);

    Mono<Datasource> findByIdAndEnvironmentId(String id, String environmentId);

    Mono<Datasource> findById(String id);

    Set<MustacheBindingToken> extractKeysFromDatasource(Datasource datasource);

    Mono<Datasource> save(Datasource datasource);

    Flux<Datasource> getAll(MultiValueMap<String, String> params);

    Flux<Datasource> getAllByWorkspaceId(String workspaceId, Optional<AclPermission> permission);

    Flux<Datasource> saveAll(List<Datasource> datasourceList);

    Mono<Datasource> create(Datasource datasource);

    Mono<Datasource> createWithoutPermissions(Datasource datasource);

    Mono<Datasource> update(String id, Datasource datasource, String environmentId);

    Mono<Datasource> update(String id, Datasource datasource, String environmentId, Boolean isUserRefreshedUpdate);

    /**
     * THis method is used to update only the datasourceStorages which has been changed.
     *
     * @param datasource
     * @param environmentId
     * @param IsUserRefreshedUpdate
     * @return
     */
    Mono<Datasource> updateDatasourceStorages(Datasource datasource, String environmentId, Boolean IsUserRefreshedUpdate);

    Mono<Datasource> archiveById(String id);

    Map<String, Object> getAnalyticsProperties(Datasource datasource);

    // TODO: Remove the following snippet after client side API changes
    DatasourceDTO convertToDatasourceDTO(Datasource datasource);

    // TODO: Remove the following snippet after client side API changes
    Datasource convertToDatasource(DatasourceDTO datasourceDTO, String environmentId);

    // TODO: Remove the following snippet after client side API changes
    String getTrueEnvironmentId(String environmentId);
}
