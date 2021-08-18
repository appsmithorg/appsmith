package com.appsmith.server.services;

import com.appsmith.server.domains.GitData;
import com.appsmith.server.domains.User;
import com.appsmith.server.dtos.GitGlobalConfigDTO;
import com.appsmith.server.repositories.GitDataRepository;
import lombok.extern.slf4j.Slf4j;
import org.eclipse.jgit.api.Git;
import org.eclipse.jgit.api.errors.GitAPIException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.ReactiveMongoTemplate;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Scheduler;

import javax.validation.Validator;
import java.io.File;

@Service
@Slf4j
public class GitDataServiceImpl extends BaseService<GitDataRepository, GitData, String> implements GitDataService {

    private final UserService userService;

    //This value comes from the env variable
    private final String path = "/Users/anaghhegde/workspace/project/";


    @Autowired
    public GitDataServiceImpl(Scheduler scheduler,
                              Validator validator,
                              MongoConverter mongoConverter,
                              ReactiveMongoTemplate reactiveMongoTemplate,
                              GitDataRepository repository,
                              AnalyticsService analyticsService,
                              UserService userService) {
        super(scheduler, validator, mongoConverter, reactiveMongoTemplate, repository, analyticsService);
        this.userService = userService;
    }

    @Override
    public Mono<User> saveGitConfigData(GitGlobalConfigDTO gitConfig) {
        /*return userService.findByEmail(gitConfig.getUserEmail())
                .flatMap(user -> {
                    user.setGitGlobalConfig(gitConfig.getGitGlobalConfig());
                    return userService.update(user.getId(), user);
                });*/
        return Mono.empty();
    }

    @Override
    public String connectToGitRepo(String url, String orgId) {
        String filePath = getFilePath(url, orgId);
        try (Git result = Git.cloneRepository()
                .setURI(url)
                .setDirectory(new File(filePath))
                .call()) {
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
        int i = 1;
        while(file.exists()) {
            repoName = repoName + "(" + i + ")" ;
            file =  new File(filePath + "/" + repoName + "/");
            i = i + 1;
        }
        return filePath + "/" + repoName + "/";
    }
}
