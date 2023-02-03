package com.appsmith.server.domains;

import com.appsmith.external.views.Views;
import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonView;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.Date;
import java.util.List;
import java.util.Map;

import static com.appsmith.server.helpers.DateUtils.ISO_FORMATTER;

@Data
@EqualsAndHashCode(callSuper = false)
@Document
public class Comment extends AbstractCommentDomain {

    @JsonView(Views.Public.class)
    String threadId;

    /**
     * The id of the user, who authored this comment.
     */
    @JsonView(Views.Internal.class)
    String authorId;

    @JsonView(Views.Public.class)
    String authorPhotoId;

    @JsonView(Views.Public.class)
    Body body;

    @JsonView(Views.Public.class)
    List<Reaction> reactions;

    /**
     * Indicates whether this comment is the leading comment in it's thread. Such a comment cannot be deleted.
     */
    @JsonView(Views.Internal.class)
    Boolean leading;

    @Data
    public static class Body {
        @JsonView(Views.Public.class)
        List<Block> blocks;
        @JsonView(Views.Public.class)
        Map<String, Entity> entityMap;
    }

    @Data
    public static class Block {
        @JsonView(Views.Public.class)
        String key;
        @JsonView(Views.Public.class)
        String text;
        @JsonView(Views.Public.class)
        String type;
        @JsonView(Views.Public.class)
        Integer depth;
        @JsonView(Views.Public.class)
        List<Range> inlineStyleRanges;
        @JsonView(Views.Public.class)
        List<Range> entityRanges;
    }

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    public static class Range {
        @JsonView(Views.Public.class)
        Integer offset;
        @JsonView(Views.Public.class)
        Integer length;
        @JsonView(Views.Public.class)
        Integer key;
    }

    @Data
    public static class Entity {
        @JsonView(Views.Public.class)
        String type;
        @JsonView(Views.Public.class)
        String mutability;
        @JsonView(Views.Public.class)
        EntityData data;
    }

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    public static class EntityData {
        @JsonView(Views.Public.class)
        Mention mention;

        @Data
        @AllArgsConstructor
        @NoArgsConstructor
        public static class Mention {
            @JsonView(Views.Public.class)
            String name;
            @JsonView(Views.Public.class)
            EntityUser user;
        }

        @Data
        @AllArgsConstructor
        @NoArgsConstructor
        public static class EntityUser {
            @JsonView(Views.Public.class)
            String username;
            @JsonView(Views.Public.class)
            String roleName;
        }
    }

    public String getCreationTime() {
        return ISO_FORMATTER.format(createdAt);
    }

    @Data
    public static class Reaction {
        @JsonView(Views.Public.class)
        String emoji;
        @JsonView(Views.Public.class)
        String byUsername;
        @JsonView(Views.Public.class)
        String byName;
        @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm:ssX", timezone = "UTC")
        @JsonView(Views.Public.class)
        Date createdAt;
    }
}
