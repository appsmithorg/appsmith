package com.appsmith.server.repositories;

import com.appsmith.server.domains.Comment;
import com.appsmith.server.domains.QComment;
import com.mongodb.client.result.UpdateResult;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.mongodb.core.ReactiveMongoOperations;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;

import static org.springframework.data.mongodb.core.query.Criteria.where;

@Component
@Slf4j
public class CustomCommentRepositoryImpl extends BaseAppsmithRepositoryImpl<Comment> implements CustomCommentRepository {

    public CustomCommentRepositoryImpl(ReactiveMongoOperations mongoOperations, MongoConverter mongoConverter) {
        super(mongoOperations, mongoConverter);
    }

    /**
     * Add a reaction, by a user, if the reaction by that user already doesn't exist on this comment.
     * @param commentId UUID string of the comment to add the reaction to.
     * @param reaction The reaction object to add to the comment.
     * @return Mono that publishes an UpdateResult that will contain the number of reactions added. It's only ever 0 or 1.
     */
    @Override
    public Mono<UpdateResult> pushReaction(String commentId, Comment.Reaction reaction) {
        final String reactionsField = fieldName(QComment.comment.reactions);
        return mongoOperations.updateFirst(
                Query.query(new Criteria().andOperator(
                        where("id").is(commentId),
                        Criteria
                                .where(reactionsField)
                                .not()
                                .elemMatch(where("emoji").is(reaction.getEmoji()).and("byUsername").is(reaction.getByUsername()))
                )),
                new Update().addToSet(reactionsField, reaction),
                Comment.class
        );
    }

    /**
     * Atomically delete a reaction, by a user, if the reaction by that user exists on this comment.
     * @param commentId UUID string of the comment on which to delete a reaction.
     * @param reaction The reaction object to be deleted.
     * @return Mono that publishes an UpdateResult that will contain the number of reactions deleted. It's usually 0 or 1, but can theoretically be more.
     */
    @Override
    public Mono<UpdateResult> deleteReaction(String commentId, Comment.Reaction reaction) {
        reaction.setByName(null);
        reaction.setCreatedAt(null);
        return mongoOperations.updateFirst(
                Query.query(where("id").is(commentId)),
                new Update().pull(fieldName(QComment.comment.reactions), reaction),
                Comment.class
        );
    }

    @Override
    public Mono<Void> updateAuthorNames(String authorId, String authorName) {
        return mongoOperations
                .updateMulti(
                        Query.query(Criteria.where("authorId").is(authorId)),
                        Update.update("authorName", authorName),
                        Comment.class
                )
                .then();
    }

}
