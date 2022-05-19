package com.appsmith.server.services.ce;

import com.appsmith.server.acl.AclConstants;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.Group;
import com.appsmith.server.repositories.GroupRepository;
import com.appsmith.server.services.AnalyticsService;
import com.appsmith.server.services.BaseService;
import com.appsmith.server.services.SessionUserService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.ReactiveMongoTemplate;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import reactor.core.publisher.Flux;
import reactor.core.scheduler.Scheduler;

import javax.validation.Validator;
import java.util.Set;
import java.util.stream.Collectors;


@Slf4j
public class GroupServiceCEImpl extends BaseService<GroupRepository, Group, String> implements GroupServiceCE {

    private final GroupRepository repository;
    private final SessionUserService sessionUserService;

    @Autowired
    public GroupServiceCEImpl(Scheduler scheduler,
                              Validator validator,
                              MongoConverter mongoConverter,
                              ReactiveMongoTemplate reactiveMongoTemplate,
                              GroupRepository repository,
                              AnalyticsService analyticsService,
                              SessionUserService sessionUserService) {
        super(scheduler, validator, mongoConverter, reactiveMongoTemplate, repository, analyticsService);
        this.repository = repository;
        this.sessionUserService = sessionUserService;
    }

    @Override
    public Flux<Group> get(MultiValueMap<String, String> params) {
        log.debug("Going to query groups with filter params: {}", params);
        Query query = new Query();

        // Add conditions to the query if there are any filter params provided
        if (params != null && !params.isEmpty()) {
            params.entrySet().stream()
                    .forEach(entry -> query.addCriteria(Criteria.where(entry.getKey()).in(entry.getValue())));
        }

        return sessionUserService.getCurrentUser()
                .map(user -> {
                    // Filtering the groups by the user's current workspace
                    String workspaceId = user.getCurrentWorkspaceId();
                    query.addCriteria(Criteria.where(FieldName.ORGANIZATION_ID).is(workspaceId));
                    return query;
                })
                .flatMapMany(query1 -> {
                    log.debug("Going to execute query: {}", query1.toString());
                    return mongoTemplate.find(query1, Group.class);
                });
    }

    @Override
    public Flux<Group> getAllById(Set<String> ids) {
        MultiValueMap<String, String> params = new LinkedMultiValueMap<>();

        if (ids != null && !ids.isEmpty()) {
            params.addAll(FieldName.ID, ids.stream().collect(Collectors.toList()));
        }

        return get(params);
    }

    /**
     * This function fetches the default groups belonging to the workspace {@link AclConstants#DEFAULT_ORG_ID}
     * and then copies them over to the current workspace. This is to ensure that each workspace has groups & permissions
     * specific to them.
     *
     * @param workspaceId The workspaceId for which we are creating default groups
     * @return Flux<Group>
     */
    @Override
    public Flux<Group> createDefaultGroupsForWorkspace(String workspaceId) {
        log.debug("Going to create default groups for workspace: {}", workspaceId);

        return this.repository.getAllByWorkspaceId(AclConstants.DEFAULT_ORG_ID)
                .flatMap(group -> {
                    Group newGroup = new Group();
                    newGroup.setName(group.getName());
                    newGroup.setDisplayName(group.getDisplayName());
                    newGroup.setWorkspaceId(workspaceId);
                    newGroup.setPermissions(group.getPermissions());
                    newGroup.setIsDefault(group.getIsDefault());
                    log.debug("Creating group {} for org: {}", group.getName(), workspaceId);
                    return create(newGroup);
                });
    }

    @Override
    public Flux<Group> getByWorkspaceId(String workspaceId) {
        return this.repository.getAllByWorkspaceId(workspaceId);
    }

}
