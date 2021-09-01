package com.appsmith.server.services;

import com.appsmith.server.domains.GitConfig;
import com.appsmith.server.domains.User;
import com.appsmith.server.domains.UserData;
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
        //update the user object to store the user credentials which will be used in future git operations
        //User userId = userService.findByEmail(gitConfig.getUserName()).block();
        return userService.findByEmail(gitConfig.getUserName())
                .flatMap(user -> userDataService
                        .getForUser(user.getId())
                        .flatMap(userData -> {
                            //handle null case
                            // $set to add field at run time
                            Map<String, GitConfig> gitConfigs = userData.getGitLocalConfigData();
                            gitConfigs.put(gitConfig.getProfileName(), gitConfig);
                            userData.setGitLocalConfigData(gitConfigs);
                            return userDataService.updateForCurrentUser(userData);
                        }));
    }

    @Override
    public Mono<UserData> updateGitConfigData(GitConfig gitConfig) {
        return userService.findByEmail(gitConfig.getUserName())
                .flatMap(user -> userDataService
                        .getForUser(user.getId())
                        .flatMap(userData -> {
                            Map<String, GitConfig> gitConfigs = userData.getGitLocalConfigData();
                            GitConfig gitConfigUpdate = gitConfigs.get(gitConfig.getProfileName());

                            gitConfigUpdate.setCommitEmail(gitConfig.getCommitEmail());
                            gitConfigUpdate.setUserName(user.getUsername());
                            gitConfigUpdate.setCommitEmail(gitConfig.getCommitEmail());
                            gitConfigUpdate.setPassword(gitConfig.getPassword());
                            gitConfigUpdate.setSshKey(gitConfig.getSshKey());
                            gitConfigUpdate.setProfileName(gitConfig.getProfileName());

                            gitConfigs.put(gitConfig.getProfileName(), gitConfigUpdate);

                            return userDataService.updateForCurrentUser(userData);
                        }));
    }
}
