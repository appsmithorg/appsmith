package com.appsmith.server.repositories;

import com.appsmith.server.domains.GitData;
import org.springframework.data.mongodb.core.ReactiveMongoOperations;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import reactor.core.publisher.Mono;

public class CustomGitRepositoryImpl extends BaseAppsmithRepositoryImpl<GitData> implements CustomGitRepository {

    public CustomGitRepositoryImpl(ReactiveMongoOperations mongoOperations, MongoConverter mongoConverter) {
        super(mongoOperations, mongoConverter);
    }

    @Override
    public Mono<GitData> GetUserDetails(String branchName) {

        return null;
    }
}
