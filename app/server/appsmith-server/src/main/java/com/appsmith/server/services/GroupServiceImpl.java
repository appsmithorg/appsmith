package com.appsmith.server.services;

import com.appsmith.server.constants.AclConstants;
import com.appsmith.server.domains.Group;
import com.appsmith.server.repositories.GroupRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.ReactiveMongoTemplate;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.scheduler.Scheduler;

import javax.validation.Validator;
import java.util.Set;

@Service
@Slf4j
public class GroupServiceImpl extends BaseService<GroupRepository, Group, String> implements GroupService {

    private final GroupRepository repository;
    private final SessionUserService sessionUserService;

    @Autowired
    public GroupServiceImpl(Scheduler scheduler,
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
    public Flux<Group> getAllById(Set<String> ids) {
        return sessionUserService.getCurrentUser()
                .flatMapMany(user -> {
                    String organizationId = user.getCurrentOrganizationId();
                    return repository.getAllByOrganizationId(organizationId);
                });
    }

    /**
     * This function fetches the default groups belonging to the organization {@link AclConstants.DEFAULT_ORG_ID}
     * and then copies them over to the current organization. This is to ensure that each organization has groups & permissions
     * specific to them.
     *
     * @param organizationId The organizationId for which we are creating default groups
     * @return Flux<Group>
     */
    @Override
    public Flux<Group> createDefaultGroupsForOrg(String organizationId) {
        log.debug("Going to create default groups for organization: {}", organizationId);

        return this.repository.getAllByOrganizationId(AclConstants.DEFAULT_ORG_ID)
                .flatMap(group -> {
                    Group newGroup = new Group();
                    newGroup.setName(group.getName());
                    newGroup.setDisplayName(group.getDisplayName());
                    newGroup.setOrganizationId(organizationId);
                    newGroup.setPermissions(group.getPermissions());
                    newGroup.setIsDefault(group.getIsDefault());
                    log.debug("Creating group {} for org: {}", group.getName(), organizationId);
                    return create(newGroup);
                });
    }

    @Override
    public Flux<Group> getByOrganizationId(String organizationId) {
        return this.repository.getAllByOrganizationId(organizationId);
    }

}
