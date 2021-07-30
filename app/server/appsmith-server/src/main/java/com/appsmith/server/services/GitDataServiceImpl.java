package com.appsmith.server.services;

import com.appsmith.server.domains.GitData;
import com.appsmith.server.repositories.GitDataRepository;
import lombok.extern.slf4j.Slf4j;
import org.eclipse.jgit.api.Git;
import org.eclipse.jgit.lib.Repository;
import org.eclipse.jgit.storage.file.FileRepositoryBuilder;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.ReactiveMongoTemplate;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.stereotype.Service;
import org.eclipse.jgit.api.errors.GitAPIException;
import reactor.core.scheduler.Scheduler;

import javax.validation.Validator;
import java.io.File;
import java.io.IOException;

@Service
@Slf4j
public class GitDataServiceImpl extends BaseService<GitDataRepository, GitData, String> implements GitDataService {

    @Autowired
    public GitDataServiceImpl(Scheduler scheduler,
                              Validator validator,
                              MongoConverter mongoConverter,
                              ReactiveMongoTemplate reactiveMongoTemplate,
                              GitDataRepository repository,
                              AnalyticsService analyticsService) {
        super(scheduler, validator, mongoConverter, reactiveMongoTemplate, repository, analyticsService);
    }

    @Override
    public Git initializeGit(String path) throws IOException, IllegalStateException, GitAPIException{
        File localPath = new File("/Users/anaghhegde/workspace/project/test");
        Git git = Git.init().setDirectory(localPath).call();
        //git.
        return git;
    }

    @Override
    public String cloneRepo(String url) throws GitAPIException, IOException {
        File localPath = new File("/Users/anaghhegde/workspace/project/test");
        File git = Git.open(localPath).getRepository().getDirectory();
        FileRepositoryBuilder repositoryBuilder = new FileRepositoryBuilder();
        repositoryBuilder.setMustExist(true);
        repositoryBuilder.setGitDir(localPath);
        Repository repository = repositoryBuilder.build();

        Git gitOpen = Git.open( new File( "/Users/anaghhegde/workspace/project/test/.git" ) );
        gitOpen.commit().setMessage("Trying jGit");
        return null;
    }
}
