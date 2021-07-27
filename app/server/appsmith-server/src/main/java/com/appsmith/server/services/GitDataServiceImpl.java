package com.appsmith.server.services;

import com.appsmith.server.domains.GitData;
import com.appsmith.server.repositories.GitDataRepository;
import lombok.extern.slf4j.Slf4j;
import org.eclipse.jgit.api.Git;
import org.eclipse.jgit.transport.UsernamePasswordCredentialsProvider;
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
    public String initializeGit(String path) throws IOException, IllegalStateException, GitAPIException{
        final File localPath = new File("./Test");
        try (Git git = Git.init().setDirectory(localPath).call()) {
            System.out.println("Having repository: " + git.getRepository().getDirectory());
        }
        return null;
    }

    @Override
    public String cloneRepo(String url) throws GitAPIException {
        final File localPath = new File("./TestRepo");
        Git.cloneRepository()
                .setURI(url)
                .setDirectory(localPath)
                .setCredentialsProvider(new UsernamePasswordCredentialsProvider("***", "***"))
                .call();
        return null;
    }
}
