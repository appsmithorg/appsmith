package com.appsmith.server.services.ce_compatible;

import com.appsmith.external.dtos.EnvironmentDTO;
import com.appsmith.external.models.Environment;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.services.CrudService;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.Map;

public interface EnvironmentServiceCECompatible extends CrudService<Environment, String> {

    Mono<EnvironmentDTO> getEnvironmentDTOByEnvironmentId(String envId);

    Flux<EnvironmentDTO> getEnvironmentDTOByWorkspaceId(String workspaceId);

    Mono<EnvironmentDTO> setDatasourceConfigurationDetailsForEnvironment(
            EnvironmentDTO environmentDTO, String workspaceId);

    Mono<EnvironmentDTO> setEnvironmentToDefault(Map<String, String> defaultEnvironmentMap);

    Flux<Environment> getDefaultEnvironment(String workspaceId);

    Mono<String> getDefaultEnvironmentId(String workspaceId, AclPermission aclPermission);

    Mono<String> verifyEnvironmentIdByWorkspaceId(
            String workspaceId, String environmentId, AclPermission aclPermission);

    Mono<EnvironmentDTO> createCustomEnvironment(Map<String, String> customEnvironmentDetails);

    Mono<EnvironmentDTO> deleteCustomEnvironment(String environmentId);

    Mono<EnvironmentDTO> updateCustomEnvironment(String customEnvironmentId, EnvironmentDTO environmentDTO);
}
