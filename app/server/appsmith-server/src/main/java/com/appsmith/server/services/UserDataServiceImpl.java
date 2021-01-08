package com.appsmith.server.services;

import com.appsmith.server.configurations.ProjectProperties;
import com.appsmith.server.domains.User;
import com.appsmith.server.domains.UserData;
import com.appsmith.server.repositories.UserDataRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.ReactiveMongoTemplate;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Scheduler;

import javax.validation.Validator;

@Service
public class UserDataServiceImpl extends BaseService<UserDataRepository, UserData, String> implements UserDataService {

    private final ProjectProperties projectProperties;

    @Autowired
    public UserDataServiceImpl(Scheduler scheduler,
                               Validator validator,
                               MongoConverter mongoConverter,
                               ReactiveMongoTemplate reactiveMongoTemplate,
                               UserDataRepository repository,
                               AnalyticsService analyticsService,
                               ProjectProperties projectProperties) {
        super(scheduler, validator, mongoConverter, reactiveMongoTemplate, repository, analyticsService);
        this.projectProperties = projectProperties;
    }

    @Override
    public Mono<UserData> getForUser(User user) {
        return user == null ? Mono.empty() : getForUser(user.getId());
    }

    @Override
    public Mono<UserData> getForUser(String userId) {
        // If an entry for this userId doesn't exist in the database, we return an empty object, since data in this
        // collection is treated to be sparse. That is, missing objects in the database are the same as empty objects.
        return StringUtils.isEmpty(userId)
                ? Mono.empty()
                : repository.findByUserId(userId).defaultIfEmpty(new UserData(userId));
    }

    @Override
    public Mono<User> setViewedCurrentVersionReleaseNotes(User user) {
        final String version = projectProperties.getVersion();
        if (user == null || StringUtils.isEmpty(version)) {
            return Mono.justOrEmpty(user);
        }

        return repository
                .saveReleaseNotesViewedVersion(user.getId(), version)
                .thenReturn(user);
    }

    @Override
    public Mono<User> ensureViewedCurrentVersionReleaseNotes(User user) {
        if (user == null) {
            return Mono.empty();
        }

        return getForUser(user)
                .flatMap(userData -> {
                    if (userData != null && userData.getReleaseNotesViewedVersion() == null) {
                        return setViewedCurrentVersionReleaseNotes(user);
                    }
                    return Mono.just(user);
                });
    }

}
