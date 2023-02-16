package com.appsmith.server.services;

import com.appsmith.external.models.EnvironmentVariable;
import com.appsmith.server.services.ce.EnvironmentVariableServiceCE;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.List;

public interface EnvironmentVariableService extends EnvironmentVariableServiceCE {
    // Read methods for access with different criteria.
    //TODO - With V1.1 of multiple environments we would be adding GAC for environmentVariables as well. for now it resides without policies
    Mono<EnvironmentVariable> findById(String id);
    Flux<EnvironmentVariable> findAllByIds(List<String> ids);
    Flux<EnvironmentVariable> findByEnvironmentId(String envId);
    Flux<EnvironmentVariable> findByWorkspaceId(String workspaceId);
    Flux<EnvironmentVariable> findByNameAndWorkspaceId(List<String> envVarNameList, String workspaceId) ;
    Flux<EnvironmentVariable> findByEnvironmentIdAndVariableNames(String environmentId, List<String> envVarNames) ;
    Flux<EnvironmentVariable> findByDatasourceIdAndEnvironmentId(String datasourceId, String environmentId);

    // Write methods used for creating new variables as well as updating variables.
    Mono<EnvironmentVariable> save(EnvironmentVariable envVariable);
    Flux<EnvironmentVariable> saveAll(List<EnvironmentVariable> envVariables);

    // Delete/Archive calls for environment variables
    Mono<EnvironmentVariable> archive(EnvironmentVariable envVariable);
    Mono<EnvironmentVariable> archiveById(String id);
    Mono<Boolean> archiveAllById(List<String> ids);
    Mono<EnvironmentVariable> archiveByNameAndEnvironmentId(EnvironmentVariable envVar) ;
    Mono<Long> archiveByDatasourceIdAndWorkspaceId(String datsourceId, String workspaceId);
}