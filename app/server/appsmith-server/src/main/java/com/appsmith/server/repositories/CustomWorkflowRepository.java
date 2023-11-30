package com.appsmith.server.repositories;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.Workflow;
import com.mongodb.client.result.UpdateResult;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.query.Update;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.Optional;

public interface CustomWorkflowRepository extends AppsmithRepository<Workflow> {

    Mono<UpdateResult> update(String id, Update updateObj, AclPermission permission);

    Flux<Workflow> findAllByWorkspaceId(String workspaceId, Optional<AclPermission> permission);

    Flux<Workflow> findAllById(
            List<String> workflowIds, Optional<AclPermission> permission, Optional<List<String>> includeFields);

    Flux<Workflow> findAll(
            Optional<AclPermission> permission, Optional<List<String>> includeFields, Optional<Sort> sortBy);
}
