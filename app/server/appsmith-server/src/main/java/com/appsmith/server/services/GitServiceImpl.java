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
import java.util.List;
import java.util.Map;

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
        return userService.findByEmail(gitConfig.getUserName())
                .flatMap(user -> userDataService
                        .getForUser(user.getId())
                        .flatMap(userData -> {
                            List<GitConfig> gitConfigs = userData.getGitLocalConfigData();
                            gitConfigs.add(gitConfig);
                            userData.setGitLocalConfigData(gitConfigs);
                            if( isProfileNameExists(gitConfigs, gitConfig.getProfileName()) ) {
                                return Mono.error(new AppsmithException(AppsmithError.DUPLICATE_KEY,
                                        "ProfileName Already exists. Please choose a different one", null));
                            }
                            return userDataService.updateForCurrentUser(userData);
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
                .flatMap(user -> userDataService
                        .getForUser(user.getId())
                        .flatMap(userData -> {
                            List<GitConfig> gitConfigs = userData.getGitLocalConfigData();
                            for(GitConfig gitLocalConfig : gitConfigs) {
                                if (gitLocalConfig.getRemoteUrl().equals(gitConfig.getRemoteUrl())) {
                                    gitLocalConfig.setCommitEmail(gitLocalConfig.getCommitEmail());
                                    gitLocalConfig.setUserName(user.getUsername());
                                    gitLocalConfig.setCommitEmail(gitConfig.getCommitEmail());
                                    gitLocalConfig.setPassword(gitConfig.getPassword());
                                    gitLocalConfig.setSshKey(gitConfig.getSshKey());
                                    gitLocalConfig.setProfileName(gitConfig.getProfileName());
                                    gitConfigs.add(gitLocalConfig);
                                }
                            }
                            return userDataService.updateForCurrentUser(userData);
                        }));
    }
}
