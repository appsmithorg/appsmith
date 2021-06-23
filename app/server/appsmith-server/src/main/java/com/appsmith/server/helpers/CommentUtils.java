package com.appsmith.server.helpers;

import com.appsmith.server.domains.Comment;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

public class CommentUtils {
    /**
     * Checks whether provided user has been mentioned in the comment. Returns true if yes and false otherwise.
     * @param comment Comment objects
     * @param userEmail email address of the user
     * @return true or false based on the condition
     */
    public static boolean isUserMentioned(Comment comment, String userEmail) {
        if(comment.getBody() != null && comment.getBody().getEntityMap() != null) {
            for(String key : comment.getBody().getEntityMap().keySet()) {
                Comment.Entity commentEntity = comment.getBody().getEntityMap().get(key);
                if(commentEntity != null && commentEntity.getType() != null
                        && commentEntity.getType().equals("mention")) {
                    // this comment has a mention, check the provided user is mentioned or not
                    if(commentEntity.getData() != null) {
                        Comment.EntityData.Mention mention = commentEntity.getData().getMention();
                        if(mention.getUser().getUsername().equals(userEmail)) {
                            return true;
                        }
                    }
                }
            }
        }
        return false;
    }

    /**
     * Returns the list of usernames who should subscribe to a thread
     * It'll include the author username. It'll also include anyone who is mentioned in this comment by the author.
     * For example, if this comment is from user1 where user2 and user3 are mentioned in this comment,
     * it'll return a list of user1, user2, user3
     * @param comment The comment object
     * @return list of usernames. Size of the list will be at least 1
     */
    public static Set<String> getSubscriberUsernames(Comment comment) {
        Set<String> usernamesSet = new HashSet<>();
        // add the author itself
        usernamesSet.add(comment.getAuthorUsername());

        if(comment.getBody() != null && comment.getBody().getEntityMap() != null) {
            for(String key : comment.getBody().getEntityMap().keySet()) {
                Comment.Entity commentEntity = comment.getBody().getEntityMap().get(key);
                if(commentEntity != null && commentEntity.getType() != null
                        && commentEntity.getType().equals("mention")) {
                    // this comment has a mention, check the provided user is mentioned or not
                    if(commentEntity.getData() != null) {
                        Comment.EntityData.Mention mention = commentEntity.getData().getMention();
                        usernamesSet.add(mention.getUser().getUsername());
                    }
                }
            }
        }
        return usernamesSet;
    }

    public static List<String> getCommentBody(Comment comment) {
        List<String> commentLines = new ArrayList<>();
        if(comment.getBody() != null && comment.getBody().getBlocks() != null) {
            for (Comment.Block block : comment.getBody().getBlocks()) {
                commentLines.add(block.getText());
            }
        }
        return commentLines;
    }
}
