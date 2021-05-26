package com.appsmith.server.repositories;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.CommentThread;
import com.appsmith.server.domains.QCommentThread;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.mongodb.core.ReactiveMongoOperations;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Flux;

import java.util.List;

import static org.springframework.data.mongodb.core.query.Criteria.where;

@Component
@Slf4j
public class CustomCommentThreadRepositoryImpl extends BaseAppsmithRepositoryImpl<CommentThread> implements CustomCommentThreadRepository {

    public CustomCommentThreadRepositoryImpl(ReactiveMongoOperations mongoOperations, MongoConverter mongoConverter) {
        super(mongoOperations, mongoConverter);
    }

    @Override
    public Flux<CommentThread> findByApplicationId(String applicationId, AclPermission permission) {
        Criteria criteria = where(fieldName(QCommentThread.commentThread.applicationId)).is(applicationId);
        return queryAll(List.of(criteria), permission);
    }

}
