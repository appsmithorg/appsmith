package com.appsmith.server.services.ce;

import com.appsmith.external.models.Datasource;
import com.appsmith.external.models.DatasourceStorage;
import com.appsmith.external.models.DatasourceTestResult;
import com.appsmith.external.models.MustacheBindingToken;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.services.CrudService;
import jakarta.validation.constraints.NotNull;
import org.reflections.util.QueryFunction;
import org.springframework.util.MultiValueMap;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.Optional;
import java.util.Set;

public interface DatasourceServiceCE extends CrudService<Datasource, String> {

    /**
     * @param datasource      - The datasource which is about to be tested
     * @param environmentName - environmentName, name of the environment on which the datasource is getting tested,
     *                        this variable is unused in the CE version of the code.
     * @return Mono<DatasourceTestResult> - result whether the datasource secures a valid connection with the remote DB
     */
    Mono<DatasourceTestResult> testDatasource(Datasource datasource, String environmentName);

    Mono<Datasource> findByNameAndWorkspaceId(String name, String workspaceId, AclPermission permission);

    Mono<Datasource> findByNameAndWorkspaceId(String name, String workspaceId, Optional<AclPermission> permission);

    Mono<Datasource> findById(String id, AclPermission aclPermission);

    Mono<Datasource> findById(String id);

    Set<MustacheBindingToken> extractKeysFromDatasource(Datasource datasource);

    Mono<Datasource> save(Datasource datasource);

    Flux<DatasourceStorage> getAllStorages(MultiValueMap<String, String> params);

    Flux<DatasourceStorage> getStoragesByWorkspaceId(String workspaceId, AclPermission permission);

    Flux<Datasource> saveAll(List<Datasource> datasourceList);

    Mono<Datasource> createWithoutPermissions(Datasource datasource);

    Mono<Datasource> update(String datasourceId, Datasource datasource, Boolean isUserRefreshedUpdate);

    Mono<DatasourceStorage> createDatasourceStorage(String datasourceId, DatasourceStorage datasourceStorage);
}
