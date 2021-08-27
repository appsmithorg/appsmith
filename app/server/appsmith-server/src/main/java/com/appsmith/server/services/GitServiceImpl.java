package com.appsmith.server.services;

import com.appsmith.server.domains.GitConfig;
import com.appsmith.server.domains.UserData;
import com.appsmith.server.dtos.GitGlobalConfigDTO;
import com.appsmith.server.repositories.UserDataRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.mongodb.core.ReactiveMongoTemplate;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Scheduler;

import javax.validation.Validator;
import java.util.List;

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
    public Mono<UserData> saveGitConfigData(GitGlobalConfigDTO gitConfig) {
        //update the user object to store the user credentials which will be used in future git operations
        return userService.findByEmail(gitConfig.getUserEmail())
                .flatMap(user -> userDataService
                        .getForUser(user.getId())
                        .flatMap(userData -> {
                            List<GitConfig> gitConfigs = userData.getGitLocalConfigData();
                            GitConfig gitLocalConfig = new GitConfig();
                            gitLocalConfig.setCommitEmail(gitLocalConfig.getCommitEmail());
                            gitLocalConfig.setUserName(user.getUsername());
                            gitLocalConfig.setCommitEmail(gitConfig.getUserEmail());
                            gitLocalConfig.setRemoteUrl(gitConfig.getRemoteUrl());
                            gitLocalConfig.setPassword(gitConfig.getPassword());
                            gitLocalConfig.setSshKey(gitConfig.getSshKey());
                            gitLocalConfig.setProfileName(gitConfig.getProfileName());
                            gitConfigs.add(gitLocalConfig);
                            userData.setGitLocalConfigData(gitConfigs);
                            return userDataService.updateForCurrentUser(userData);
                        }));
    }

    @Override
    public Mono<UserData> updateGitConfigData(GitGlobalConfigDTO gitConfig) {
        return userService.findByEmail(gitConfig.getUserEmail())
                .flatMap(user -> userDataService
                        .getForUser(user.getId())
                        .flatMap(userData -> {
                            List<GitConfig> gitConfigs = userData.getGitLocalConfigData();
                            for(GitConfig gitLocalConfig : gitConfigs) {
                                if( gitLocalConfig.getRemoteUrl().equals(gitConfig.getRemoteUrl())) {
                                    gitLocalConfig.setCommitEmail(gitLocalConfig.getCommitEmail());
                                    gitLocalConfig.setUserName(user.getUsername());
                                    gitLocalConfig.setCommitEmail(gitConfig.getUserEmail());
                                    gitLocalConfig.setPassword(gitConfig.getPassword());
                                    gitLocalConfig.setSshKey(gitConfig.getSshKey());
                                    gitLocalConfig.setProfileName(gitConfig.getProfileName());
                                    gitConfigs.add(gitLocalConfig);
                                    userData.setGitLocalConfigData(gitConfigs);
                                }
                            }
                            return userDataService.updateForCurrentUser(userData);
                        }));
    }
}
