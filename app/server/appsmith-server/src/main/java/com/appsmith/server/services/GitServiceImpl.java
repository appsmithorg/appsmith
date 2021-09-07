package com.appsmith.server.services;

import com.appsmith.external.services.EncryptionService;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.GitApplicationMetadata;
import com.appsmith.server.domains.GitConfig;
import com.appsmith.server.domains.UserData;
import com.appsmith.server.dtos.GitConnectDTO;
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
import java.util.Optional;

@Slf4j
@Service
public class GitServiceImpl extends BaseService<UserDataRepository, UserData, String> implements GitService {

    private final UserService userService;

    private final UserDataService userDataService;

    private final SessionUserService sessionUserService;

    private final ApplicationService applicationService;

    private final EncryptionService encryptionService;

    private final String defaultBranchName = "master";

    public GitServiceImpl(Scheduler scheduler,
                          Validator validator,
                          MongoConverter mongoConverter,
                          ReactiveMongoTemplate reactiveMongoTemplate,
                          UserDataRepository repository,
                          AnalyticsService analyticsService,
                          UserService userService,
                          UserDataService userDataService,
                          SessionUserService sessionUserService,
                          ApplicationService applicationService,
                          EncryptionService encryptionService) {
        super(scheduler, validator, mongoConverter, reactiveMongoTemplate, repository, analyticsService);
        this.userService = userService;
        this.userDataService = userDataService;
        this.sessionUserService = sessionUserService;
        this.applicationService = applicationService;
        this.encryptionService = encryptionService;
    }

    @Override
    public Mono<UserData> saveGitConfigData(GitConfig gitConfig) {
        if(gitConfig.getAuthorName() == null || gitConfig.getAuthorName().length() == 0) {
            return Mono.error( new AppsmithException( AppsmithError.INVALID_PARAMETER, "Author Name ", ""));
        }
        if(gitConfig.getAuthorEmail() == null || gitConfig.getAuthorEmail().length() == 0) {
            return Mono.error( new AppsmithException( AppsmithError.INVALID_PARAMETER, "Author Email ", ""));
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
    *  We are implementing the deployKeys approach and since the deploy-keys are repo level these keys are store under application.
    *  Each application is equal to a repo in the git
    *  @param GitAuth - contains the deploy-key(public and private keys generated which then needs to be configured at git repo)
    *  @param applicationId - this is used to link the git repo to an application
    *  @param remoteUrl - used for the git push pull branch etc
    *  @param gitConfig - user can chose to have a different authorName & Email for a specific repo if not set then the default from the userData will be used
    *  @return Application object
    * */
    @Override
    public Mono<Application> connectApplicationToGit(GitConnectDTO gitConnectDTO) {
        /*
        * Two scenarios
        *  1. Connecting the application for the first time
        *
        *  2. Update the deployKey or remoteUrl
        * */

        Application application = new Application();
        GitApplicationMetadata gitApplicationMetadata = new GitApplicationMetadata();

        if(gitConnectDTO.getGitAuth() == null
                || gitConnectDTO.getGitAuth().getPrivateKey() == null
                || gitConnectDTO.getGitAuth().getPublicKey() == null) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, "SSH Key", ""));
        }

        if(gitConnectDTO.getRemoteUrl() == null ) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, "Remote Url", ""));
        }

        String encryptedKey = encryptionService.encryptString(gitConnectDTO.getGitAuth().getPrivateKey());
        gitApplicationMetadata.setGitAuth(gitConnectDTO.getGitAuth());
        gitApplicationMetadata.getGitAuth().setPrivateKey(encryptedKey);

        gitApplicationMetadata.setIsDefault(Boolean.TRUE);
        gitApplicationMetadata.setDefaultApplicationId(gitConnectDTO.getApplicationId());
        gitApplicationMetadata.setBranchName(defaultBranchName);
        if(!Optional.ofNullable(gitConnectDTO.getAuthorName()).isEmpty()) {
            gitApplicationMetadata.setAuthorName(gitConnectDTO.getAuthorName());
        }
        if(!Optional.ofNullable(gitConnectDTO.getAuthorEmail()).isEmpty()) {
            gitApplicationMetadata.setAuthorEmail(gitConnectDTO.getAuthorEmail());
        }
        application.setGitApplicationMetadata(gitApplicationMetadata);

        return applicationService.update(gitConnectDTO.getApplicationId(), application);
    }

    public void updateGitApplicationMetadata(GitConnectDTO gitConnectDTO) {

    }
}
