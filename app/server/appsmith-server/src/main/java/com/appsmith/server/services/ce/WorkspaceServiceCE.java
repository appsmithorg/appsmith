package com.appsmith.server.services.ce;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.User;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.dtos.PermissionGroupInfoDTO;
import com.appsmith.server.dtos.WorkspaceTokenDTO;
import com.appsmith.server.services.CrudService;
import org.springframework.http.codec.multipart.Part;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.Set;

public interface WorkspaceServiceCE extends CrudService<Workspace, String> {

    Mono<Workspace> create(Workspace workspace);

    Mono<Workspace> createDefault(Workspace workspace, User user);

    Mono<Workspace> create(Workspace workspace, User user, Boolean isDefault);

    Mono<Workspace> getById(String id);

    Mono<Workspace> findById(String id, AclPermission permission);

    Mono<Workspace> save(Workspace workspace);

    Mono<Workspace> findByIdAndPluginsPluginId(String workspaceId, String pluginId);

    Flux<Workspace> findByIdsIn(Set<String> ids, String tenantId, AclPermission permission);

    Flux<Workspace> getAll(AclPermission permission);

    Mono<List<PermissionGroupInfoDTO>> getPermissionGroupsForWorkspace(String workspaceId);

    Mono<Workspace> uploadLogo(String workspaceId, Part filePart);

    Mono<Workspace> deleteLogo(String workspaceId);

    Flux<Workspace> getAll();

    Mono<Workspace> archiveById(String s);

    Mono<String> getDefaultEnvironmentId(String workspaceId, AclPermission aclPermission);

    Mono<WorkspaceTokenDTO> generateWorkspaceToken(String workspaceId) throws Exception;
}
