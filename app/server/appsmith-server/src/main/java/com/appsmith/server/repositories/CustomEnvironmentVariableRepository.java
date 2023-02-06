package com.appsmith.server.repositories;

import com.appsmith.external.models.EnvironmentVariable;
import com.appsmith.server.repositories.ce.CustomEnvironmentVariableRepositoryCE;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.List;

public interface CustomEnvironmentVariableRepository extends CustomEnvironmentVariableRepositoryCE {
     Flux<EnvironmentVariable> findAllByIds(List<String> ids);
     Flux<EnvironmentVariable> findByEnvironmentId(String envId) ;
     Flux<EnvironmentVariable> findByWorkspaceId(String workspaceId) ;
     Flux<EnvironmentVariable> findByDatasourceIdAndEnvironmentId(String datasourceId, String environmentId);
     Flux<EnvironmentVariable> findByNameAndWorkspaceId(List<String> envVarNameList, String workspaceId) ;
     Flux<EnvironmentVariable> findByEnvironmentIdAndVariableNames(String environmentId, List<String> envVarNames) ;
     Mono<EnvironmentVariable> archiveByNameAndEnvironmentId(EnvironmentVariable envVar) ;
     Mono<Long> archiveByDatasourceIdAndWorkspaceId(String datasourceId, String workspaceId);
}
