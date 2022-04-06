package com.appsmith.server.repositories.ce;

import com.appsmith.server.domains.Comment;
import com.appsmith.server.repositories.AppsmithRepository;
import com.mongodb.client.result.UpdateResult;
import reactor.core.publisher.Mono;

public interface CustomCommentRepositoryCE extends AppsmithRepository<Comment> {

    Mono<UpdateResult> pushReaction(String commentId, Comment.Reaction reaction);

    Mono<UpdateResult> deleteReaction(String commentId, Comment.Reaction reaction);

    Mono<Void> updateAuthorNames(String authorId, String authorName);

    Mono<Void> updatePhotoId(String authorId, String photoId);
}
