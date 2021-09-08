package com.appsmith.server.services;

import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.GitApplicationMetadata;
import com.appsmith.server.domains.GitConfig;
import com.appsmith.server.domains.UserData;
import com.appsmith.server.dtos.GitConnectDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.repositories.UserDataRepository;
import lombok.extern.slf4j.Slf4j;
import org.pf4j.util.StringUtils;
import org.springframework.data.mongodb.core.ReactiveMongoTemplate;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Scheduler;

import javax.validation.Validator;
import java.util.Optional;

@Slf4j
@Service
public class GitServiceImpl extends BaseService<UserDataRepository, UserData, String> implements GitService {

    private final UserService userService;

    private final UserDataService userDataService;

    private final SessionUserService sessionUserService;

    private final ApplicationService applicationService;

    private final static String DEFAULT_BRANCH_NAME = "master";

    public GitServiceImpl(Scheduler scheduler,
                          Validator validator,
                          MongoConverter mongoConverter,
                          ReactiveMongoTemplate reactiveMongoTemplate,
                          UserDataRepository repository,
                          AnalyticsService analyticsService,
                          UserService userService,
                          UserDataService userDataService,
                          SessionUserService sessionUserService,
                          ApplicationService applicationService) {
        super(scheduler, validator, mongoConverter, reactiveMongoTemplate, repository, analyticsService);
        this.userService = userService;
        this.userDataService = userDataService;
        this.sessionUserService = sessionUserService;
        this.applicationService = applicationService;
    }

    @Override
    public Mono<UserData> saveGitConfigData(GitConfig gitConfig) {
        if(gitConfig.getAuthorName() == null || gitConfig.getAuthorName().length() == 0) {
            return Mono.error( new AppsmithException( AppsmithError.INVALID_PARAMETER, "Author Name"));
        }
        if(gitConfig.getAuthorEmail() == null || gitConfig.getAuthorEmail().length() == 0) {
            return Mono.error( new AppsmithException( AppsmithError.INVALID_PARAMETER, "Author Email"));
        }
        return sessionUserService.getCurrentUser()
                .flatMap(user -> userService.findByEmail(user.getEmail()))
                .flatMap(user -> userDataService
                        .getForUser(user.getId())
                        .flatMap(userData -> {

                            /*
                            *  The gitConfig will be null if the user has not created profiles.
                            *  If null then we need to create this field for the currentUser and save the profile data
                            *  Else, replace the existing config value with the latest information
                            *  This config is used as the default git metadata in application object
                            * */

                            userData.setGitGlobalConfigData(gitConfig);
                            return userDataService.updateForUser(user, userData);
                        }));
    }

    @Override
    public Mono<GitConfig> getGitConfigForUser() {
        return userDataService.getForCurrentUser()
                .map(userData -> userData.getGitGlobalConfigData());
    }

    /*
    *  Connect the application from Appsmith to a git repo
    *  This is the prerequisite step needed to perform all the git operation for an application
    *  We are implementing the deployKey approach and since the deploy-keys are repo level these keys are store under application.
    *  Each application is equal to a repo in the git(and each branch creates a new application with default application as parent)
    *  @param GitConnectDTO
    *            applicationId - this is used to link the git repo to an application
    *            remoteUrl - used for the git push pull branch etc
    *  @return Application object with the updated data
    * */
    @Override
    public Mono<Application> connectApplicationToGit(GitConnectDTO gitConnectDTO) {
        /*
        *  Connecting the application for the first time
        *  The ssh keys is already present in application object from the generate SSH key step
        *  We would be updating the remote url and default branchName
        * */

        if(StringUtils.isNullOrEmpty(gitConnectDTO.getRemoteUrl())) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, "Remote Url"));
        }

        return applicationService.getById(gitConnectDTO.getApplicationId())
                .flatMap(application -> {
                    GitApplicationMetadata gitApplicationMetadata = application.getGitApplicationMetadata();
                    if(Optional.ofNullable(gitApplicationMetadata).isEmpty()
                            || Optional.ofNullable(gitApplicationMetadata.getGitAuth()).isEmpty()
                            || StringUtils.isNullOrEmpty(gitApplicationMetadata.getGitAuth().getPrivateKey())
                            || StringUtils.isNullOrEmpty(gitApplicationMetadata.getGitAuth().getPublicKey())) {
                        return Mono.error( new AppsmithException( AppsmithError.INVALID_PARAMETER,
                                "SSH Key is empty. Please reach out to Appsmith support"));
                    } else {
                        gitApplicationMetadata.setIsDefault(Boolean.TRUE);
                        gitApplicationMetadata.setBranchName(DEFAULT_BRANCH_NAME);
                        gitApplicationMetadata.setRemoteUrl(gitConnectDTO.getRemoteUrl());
                        Application application1 = new Application();
                        application1.setGitApplicationMetadata(gitApplicationMetadata);
                        return applicationService.update(gitConnectDTO.getApplicationId(), application1);
                    }
                });
    }
}
