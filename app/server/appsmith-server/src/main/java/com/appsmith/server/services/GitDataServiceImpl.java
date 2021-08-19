package com.appsmith.server.services;

import com.appsmith.server.domains.GitConfig;
import com.appsmith.server.domains.GitData;
import com.appsmith.server.domains.User;
import com.appsmith.server.domains.UserData;
import com.appsmith.server.dtos.GitGlobalConfigDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.repositories.GitDataRepository;
import lombok.extern.slf4j.Slf4j;
import org.eclipse.jgit.api.Git;
import org.eclipse.jgit.api.errors.GitAPIException;
import org.eclipse.jgit.transport.CredentialsProvider;
import org.eclipse.jgit.transport.UsernamePasswordCredentialsProvider;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.ReactiveMongoTemplate;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Scheduler;

import javax.validation.Validator;
import java.io.File;
import java.util.List;

@Service
@Slf4j
public class GitDataServiceImpl extends BaseService<GitDataRepository, GitData, String> implements GitDataService {

    private final UserService userService;

    private final UserDataService userDataService;

    //This value comes from the env variable
    private final String path = "/Users/anaghhegde/workspace/project/";


    @Autowired
    public GitDataServiceImpl(Scheduler scheduler,
                              Validator validator,
                              MongoConverter mongoConverter,
                              ReactiveMongoTemplate reactiveMongoTemplate,
                              GitDataRepository repository,
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
                            gitConfigs.add(gitLocalConfig);
                            userData.setGitLocalConfigData(gitConfigs);
                            return userDataService.updateForCurrentUser(userData);
                        }));
    }

    @Override
    public String connectToGitRepo(GitGlobalConfigDTO gitGlobalConfigDTO) {
        String filePath = getFilePath(gitGlobalConfigDTO.getRemoteUrl(), gitGlobalConfigDTO.getOrganizationId());
        try (Git result = Git.cloneRepository()
                .setURI(gitGlobalConfigDTO.getRemoteUrl())
                .setCredentialsProvider(new UsernamePasswordCredentialsProvider("",""))
                .setDirectory(new File(filePath))
                .call()) {
            saveGitConfigData(gitGlobalConfigDTO);
            return result.getRepository().toString();
        } catch (GitAPIException e) {
            e.printStackTrace();
        }
        return null;
    }

    private String getFilePath(String url, String orgId) {
        String filePath = path + orgId;
        File file = new File(filePath);
        if(!file.exists()) {
            file.mkdir();
        }
        String[] urlArray = url.split("/");
        String repoName = urlArray[urlArray.length-1].replace(".git", "");
        file = new File(filePath + "/" + repoName + "/");

        //if the file with same exists, append the number at the end of the name until the proper name is found
        int i = 1;
        String currentName = repoName;
        while(file.exists()) {
            currentName = repoName + "(" + i + ")" ;
            file =  new File(filePath + "/" + currentName + "/");
            i = i + 1;
        }
        return filePath + "/" + currentName + "/";
    }
}
