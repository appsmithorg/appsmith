package com.appsmith.server.services;

import com.appsmith.server.domains.GitData;
import com.appsmith.server.domains.User;
import com.appsmith.server.dtos.GitGlobalConfigDTO;
import com.appsmith.server.repositories.GitDataRepository;
import lombok.extern.slf4j.Slf4j;
import org.eclipse.jgit.api.Git;
import org.eclipse.jgit.api.errors.GitAPIException;
import org.eclipse.jgit.api.errors.InvalidRemoteException;
import org.eclipse.jgit.api.errors.TransportException;
import org.eclipse.jgit.lib.Repository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.ReactiveMongoTemplate;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Scheduler;

import javax.validation.Validator;
import java.io.File;
import java.io.IOException;

@Service
@Slf4j
public class GitDataServiceImpl extends BaseService<GitDataRepository, GitData, String> implements GitDataService {

    private final UserService userService;
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
        return userService.findByEmail(gitConfig.getUserEmail())
                .flatMap(user -> {
                    user.setGitGlobalConfig(gitConfig.getGitGlobalConfig());
                    return userService.update(user.getId(), user);
                });
    }

    @Override
    public Repository connectToGitRepo(String url) throws IOException {
        File localPath = File.createTempFile("TestGitRepository", "");
        if(!localPath.delete()) {
            throw new IOException("Could not delete temporary file " + localPath);
        }
        try (Git result = Git.cloneRepository()
                .setURI(url)
                .setDirectory(localPath)
                .call()) {
            // Note: the call() returns an opened repository already which needs to be closed to avoid file handle leaks!
            return result.getRepository();
        } catch (InvalidRemoteException e) {
            e.printStackTrace();
        } catch (TransportException e) {
            e.printStackTrace();
        } catch (GitAPIException e) {
            e.printStackTrace();
        }
        return null;
    }


}
