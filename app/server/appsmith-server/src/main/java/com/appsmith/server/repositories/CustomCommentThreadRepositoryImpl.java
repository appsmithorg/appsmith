package com.appsmith.server.repositories;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.CommentThread;
import com.appsmith.server.domains.QCommentThread;
import com.mongodb.client.result.UpdateResult;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.mongodb.core.ReactiveMongoOperations;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.Set;

import static org.springframework.data.mongodb.core.query.Criteria.where;

@Component
@Slf4j
public class CustomCommentThreadRepositoryImpl extends BaseAppsmithRepositoryImpl<CommentThread>
        implements CustomCommentThreadRepository {

    public CustomCommentThreadRepositoryImpl(ReactiveMongoOperations mongoOperations, MongoConverter mongoConverter) {
        super(mongoOperations, mongoConverter);
    }

    @Override
    public Flux<CommentThread> findByApplicationId(String applicationId, AclPermission permission) {
        Criteria criteria = where(fieldName(QCommentThread.commentThread.applicationId)).is(applicationId);
        return queryAll(List.of(criteria), permission);
    }

    /**
     * Adds the provided username i.e. email address to the subscriber list of this thread
     * @return updated result object
     */
    @Override
    public Mono<UpdateResult> addToSubscribers(String threadId, Set<String> usernames) {
        return mongoOperations.updateFirst(
                Query.query(where("id").is(threadId)),
                new Update().addToSet(fieldName(QCommentThread.commentThread.subscribers)).each(usernames),
                CommentThread.class
        );
    }
}
