package com.appsmith.server.services.ce_compatible;

import com.appsmith.server.domains.UserGroup;
import com.appsmith.server.dtos.PagedDomain;
import com.appsmith.server.dtos.ProvisionResourceDto;
import com.appsmith.server.dtos.UserGroupDTO;
import com.appsmith.server.dtos.UserGroupUpdateDTO;
import com.appsmith.server.dtos.UsersForGroupDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.repositories.UserGroupRepository;
import com.appsmith.server.services.AnalyticsService;
import com.appsmith.server.services.BaseService;
import jakarta.validation.Validator;
import org.springframework.data.mongodb.core.ReactiveMongoTemplate;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.stereotype.Service;
import org.springframework.util.MultiValueMap;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Scheduler;

import java.util.List;

@Service
public class UserGroupServiceCECompatibleImpl extends BaseService<UserGroupRepository, UserGroup, String>
        implements UserGroupServiceCECompatible {
    public UserGroupServiceCECompatibleImpl(
            Scheduler scheduler,
            Validator validator,
            MongoConverter mongoConverter,
            ReactiveMongoTemplate reactiveMongoTemplate,
            UserGroupRepository repository,
            AnalyticsService analyticsService) {
        super(scheduler, validator, mongoConverter, reactiveMongoTemplate, repository, analyticsService);
    }

    @Override
    public Mono<ProvisionResourceDto> updateProvisionGroup(String id, UserGroupUpdateDTO resource) {
        return Mono.error(new AppsmithException(AppsmithError.UNSUPPORTED_OPERATION));
    }

    @Override
    public Mono<ProvisionResourceDto> getProvisionGroup(String groupId) {
        return Mono.error(new AppsmithException(AppsmithError.UNSUPPORTED_OPERATION));
    }

    @Override
    public Mono<PagedDomain<ProvisionResourceDto>> getProvisionGroups(MultiValueMap<String, String> queryParams) {
        return Mono.error(new AppsmithException(AppsmithError.UNSUPPORTED_OPERATION));
    }

    @Override
    public Mono<ProvisionResourceDto> createProvisionGroup(UserGroup userGroup) {
        return Mono.error(new AppsmithException(AppsmithError.UNSUPPORTED_OPERATION));
    }

    @Override
    public Mono<List<UserGroupDTO>> removeUsersFromProvisionGroup(UsersForGroupDTO removeUsersFromGroupDTO) {
        return Mono.error(new AppsmithException(AppsmithError.UNSUPPORTED_OPERATION));
    }

    @Override
    public Mono<List<UserGroupDTO>> addUsersToProvisionGroup(UsersForGroupDTO addUsersFromGroupDTO) {
        return Mono.error(new AppsmithException(AppsmithError.UNSUPPORTED_OPERATION));
    }

    @Override
    public Mono<UserGroup> archiveProvisionGroupById(String id) {
        return Mono.error(new AppsmithException(AppsmithError.UNSUPPORTED_OPERATION));
    }
}
