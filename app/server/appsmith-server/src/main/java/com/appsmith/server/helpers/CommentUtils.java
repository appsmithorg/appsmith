package com.appsmith.server.helpers;

import com.appsmith.server.domains.Comment;
import org.springframework.util.CollectionUtils;

import java.util.ArrayList;
import java.util.List;

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
                if(commentEntity.getType().equals("mention")) {
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
