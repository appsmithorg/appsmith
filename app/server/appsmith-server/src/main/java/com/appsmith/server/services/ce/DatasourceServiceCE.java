package com.appsmith.server.services.ce;

import com.appsmith.external.models.ActionDTO;
import com.appsmith.external.models.BaseDomain;
import com.appsmith.external.models.Datasource;
import com.appsmith.external.models.DatasourceTestResult;
import com.appsmith.external.models.MustacheBindingToken;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.DatasourceContextIdentifier;
import com.appsmith.server.services.CrudService;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.util.function.Tuple3;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;

public interface DatasourceServiceCE extends CrudService<Datasource, String> {

    /**
     *
     * @param datasource - The datasource which is about to be tested
     * @param environmentName - environmentName, name of the environment on which the datasource is getting tested,
     *                         this variable is unused in the CE version of the code.
     * @return Mono<DatasourceTestResult> - result whether the datasource secures a valid connection with the remote DB
     */
    Mono<DatasourceTestResult> testDatasource(Datasource datasource, String environmentName);

    Mono<Datasource> findByNameAndWorkspaceId(String name, String workspaceId, AclPermission permission);

    Mono<Datasource> findByNameAndWorkspaceId(String name, String workspaceId, Optional<AclPermission> permission);

    Mono<Datasource> findById(String id, AclPermission aclPermission);

    Mono<Datasource> findById(String id);

    Set<MustacheBindingToken> extractKeysFromDatasource(Datasource datasource);

    Mono<Datasource> validateDatasource(Datasource datasource);

    Mono<Datasource> save(Datasource datasource);

    Flux<Datasource> findAllByWorkspaceId(String workspaceId, AclPermission readDatasources);

    Flux<Datasource> findAllByWorkspaceId(String workspaceId, Optional<AclPermission> readDatasources);

    Flux<Datasource> saveAll(List<Datasource> datasourceList);

    Mono<Datasource> populateHintMessages(Datasource datasource);

    Mono<Datasource> update(String datasourceId, Datasource datasource, Boolean isUserRefreshedUpdate);

    Mono<Datasource> getValidDatasourceFromActionMono(ActionDTO actionDTO, AclPermission aclPermission);

    Mono<Datasource> createWithoutPermissions(Datasource datasource);

    Mono<Tuple3<Datasource, DatasourceContextIdentifier, Map<String, BaseDomain>>>
    getEvaluatedDSAndDsContextKeyWithEnvMap(Datasource datasource, String environmentName);

}
