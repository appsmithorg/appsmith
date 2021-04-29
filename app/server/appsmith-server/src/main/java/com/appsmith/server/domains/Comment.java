package com.appsmith.server.domains;

import com.appsmith.external.models.BaseDomain;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;
import lombok.EqualsAndHashCode;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.List;
import java.util.Map;

@Data
@EqualsAndHashCode(callSuper = false)
@Document
public class Comment extends BaseDomain {

    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    String threadId;

    /**
     * The id of the user, who authored this comment.
     */
    @JsonIgnore
    String authorId;

    /**
     * Display name of the user, who authored this comment.
     */
    @JsonProperty(access = JsonProperty.Access.READ_ONLY)
    String authorName;

    Body body;

    /**
     * Indicates whether this comment is the leading comment in it's thread. Such a comment cannot be deleted.
     */
    @JsonIgnore
    Boolean leading;

    @Data
    public static class Body {
        List<Block> blocks;
        Map<String, Entity> entityMap;
    }

    @Data
    public static class Block {
        String key;
        String text;
        String type;
        Integer depth;
        List<Range> inlineStyleRanges;
        List<Range> entityRanges;
    }

    @Data
    public static class Range {
        Integer offset;
        Integer length;
        Integer key;
    }

    @Data
    public static class Entity {
        String type;
        String mutability;
        EntityData data;
    }

    @Data
    public static class EntityData {
        Mention mention;

        @Data
        public static class Mention {
            String name;
            EntityUser user;
        }

        @Data
        public static class EntityUser {
            String username;
            String roleName;
        }
    }

}
