package com.appsmith.server.repositories;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.CommentThread;
import com.appsmith.server.domains.QCommentThread;
import com.appsmith.server.dtos.CommentThreadFilterDTO;
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

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;

import static java.lang.Boolean.TRUE;
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

    @Override
    public Mono<CommentThread> findPrivateThread(String applicationId) {
        List<Criteria> criteria = List.of(
                where(fieldName(QCommentThread.commentThread.applicationId)).is(applicationId),
                where(fieldName(QCommentThread.commentThread.isPrivate)).is(TRUE)
        );
        return queryOne(criteria, AclPermission.READ_THREAD);
    }

    @Override
    public Mono<UpdateResult> removeSubscriber(String threadId, String username) {
        Update update = new Update().pull(fieldName(QCommentThread.commentThread.subscribers), username);
        return this.updateById(threadId, update, AclPermission.READ_THREAD);
    }

    @Override
    public Mono<UpdateResult> archiveByPageId(String pageId) {
        // create an update object that'll be applied
        Update update = new Update();
        update.set(fieldName(QCommentThread.commentThread.deleted), true);
        update.set(fieldName(QCommentThread.commentThread.deletedAt), Instant.now());

        // create a criteria for pageId. The permission criteria will be added by updateByCriteria method
        Criteria criteria = where(fieldName(QCommentThread.commentThread.pageId)).is(pageId);
        return this.updateByCriteria(criteria, update, AclPermission.MANAGE_THREAD);
    }

    @Override
    public Mono<Long> countUnreadThreads(String applicationId, String userEmail) {
        String resolvedActiveFieldKey = String.format("%s.%s",
                fieldName(QCommentThread.commentThread.resolvedState),
                fieldName(QCommentThread.commentThread.resolvedState.active)
        );
        List<Criteria> criteriaList = List.of(
                where(fieldName(QCommentThread.commentThread.viewedByUsers)).ne(userEmail),
                where(fieldName(QCommentThread.commentThread.applicationId)).is(applicationId),
                where(resolvedActiveFieldKey).is(false)
        );
        return count(criteriaList, AclPermission.READ_THREAD);
    }

    @Override
    public Flux<CommentThread> find(CommentThreadFilterDTO commentThreadFilterDTO, AclPermission permission) {
        List<Criteria> criteriaList = new ArrayList<>();
        criteriaList.add(
                where(fieldName(QCommentThread.commentThread.applicationId))
                        .is(commentThreadFilterDTO.getApplicationId())
        );

        if(commentThreadFilterDTO.getResolved() != null) {
            String fieldKey = String.format("%s.%s",
                    fieldName(QCommentThread.commentThread.resolvedState),
                    fieldName(QCommentThread.commentThread.resolvedState.active)
            );
            criteriaList.add(where(fieldKey).is(commentThreadFilterDTO.getResolved()));
        }
        return queryAll(criteriaList, permission);
    }
}
