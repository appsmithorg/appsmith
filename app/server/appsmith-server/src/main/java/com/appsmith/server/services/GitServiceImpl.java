package com.appsmith.server.services;

import com.appsmith.server.domains.GitConfig;
import com.appsmith.server.domains.User;
import com.appsmith.server.domains.UserData;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.repositories.UserDataRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.mongodb.core.ReactiveMongoTemplate;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Scheduler;

import javax.validation.Validator;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Slf4j
@Service
public class GitServiceImpl extends BaseService<UserDataRepository, UserData, String> implements GitService {

    private final UserService userService;

    private final UserDataService userDataService;

    public GitServiceImpl(Scheduler scheduler,
                          Validator validator,
                          MongoConverter mongoConverter,
                          ReactiveMongoTemplate reactiveMongoTemplate,
                          UserDataRepository repository,
                          AnalyticsService analyticsService,
                          UserService userService,
                          UserDataService userDataService) {
        super(scheduler, validator, mongoConverter, reactiveMongoTemplate, repository, analyticsService);
        this.userService = userService;
        this.userDataService = userDataService;
    }

    @Override
    public Mono<UserData> saveGitConfigData(GitConfig gitConfig) {
        if(gitConfig.getProfileName() == null || gitConfig.getProfileName().length() == 0) {
            return Mono.error( new AppsmithException( AppsmithError.INVALID_PARAMETER, "Profile Name", ""));
        }
        return userService.findByEmail(gitConfig.getUserName())
                .flatMap(user -> userDataService
                        .getForUser(user.getId())
                        .flatMap(userData -> {
                            List<GitConfig> gitConfigs = new ArrayList<>();

                            /*
                            *  The gitConfig will be null if the user has not created profiles.
                            *  If null then we need to create this field for the currentUser and save the profile data
                            *  Else, append the
                            * */

                            if( Optional.ofNullable(userData.getGitLocalConfigData()).isEmpty() ) {
                                gitConfigs.add(gitConfig);
                                userData.setGitLocalConfigData(gitConfigs);
                            } else {
                                gitConfigs = userData.getGitLocalConfigData();
                                if( isProfileNameExists(gitConfigs, gitConfig.getProfileName()) ) {
                                    return Mono.error(new AppsmithException(AppsmithError.DUPLICATE_KEY_USER_ERROR,
                                            "Profile Name - " + gitConfig.getProfileName(),
                                            "Profile Name.",
                                            null));
                                }
                                gitConfigs.add(gitConfig);
                                userData.setGitLocalConfigData(gitConfigs);
                            }
                            return userDataService.updateForUser(user, userData);
                        }));
    }

    private boolean isProfileNameExists(List<GitConfig> gitConfigs, String name) {
        for (GitConfig config: gitConfigs) {
            if(config.getProfileName().equals(name)) {
                return true;
            }
        }
        return false;
    }

    @Override
    public Mono<UserData> updateGitConfigData(GitConfig gitConfig) {
        return userService.findByEmail(gitConfig.getUserName())
                .flatMap(user -> userDataService.getForUser(user.getId())
                        .flatMap(userData -> userDataService.updateGitConfigProfile(user, gitConfig)));
    }
}
