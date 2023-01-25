package com.appsmith.server.domains;

import com.appsmith.external.models.Views;
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

    @JsonView(Views.Api.class)
    String threadId;

    /**
     * The id of the user, who authored this comment.
     */
    @JsonView(Views.Internal.class)
    String authorId;

    @JsonView(Views.Api.class)
    String authorPhotoId;

    @JsonView(Views.Api.class)
    Body body;

    @JsonView(Views.Api.class)
    List<Reaction> reactions;

    /**
     * Indicates whether this comment is the leading comment in it's thread. Such a comment cannot be deleted.
     */
    @JsonView(Views.Internal.class)
    Boolean leading;

    @Data
    public static class Body {
        @JsonView(Views.Api.class)
        List<Block> blocks;
        @JsonView(Views.Api.class)
        Map<String, Entity> entityMap;
    }

    @Data
    public static class Block {
        @JsonView(Views.Api.class)
        String key;
        @JsonView(Views.Api.class)
        String text;
        @JsonView(Views.Api.class)
        String type;
        @JsonView(Views.Api.class)
        Integer depth;
        @JsonView(Views.Api.class)
        List<Range> inlineStyleRanges;
        @JsonView(Views.Api.class)
        List<Range> entityRanges;
    }

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    public static class Range {
        @JsonView(Views.Api.class)
        Integer offset;
        @JsonView(Views.Api.class)
        Integer length;
        @JsonView(Views.Api.class)
        Integer key;
    }

    @Data
    public static class Entity {
        @JsonView(Views.Api.class)
        String type;
        @JsonView(Views.Api.class)
        String mutability;
        @JsonView(Views.Api.class)
        EntityData data;
    }

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    public static class EntityData {
        @JsonView(Views.Api.class)
        Mention mention;

        @Data
        @AllArgsConstructor
        @NoArgsConstructor
        public static class Mention {
            @JsonView(Views.Api.class)
            String name;
            @JsonView(Views.Api.class)
            EntityUser user;
        }

        @Data
        @AllArgsConstructor
        @NoArgsConstructor
        public static class EntityUser {
            @JsonView(Views.Api.class)
            String username;
            @JsonView(Views.Api.class)
            String roleName;
        }
    }

    public String getCreationTime() {
        return ISO_FORMATTER.format(createdAt);
    }

    @Data
    public static class Reaction {
        @JsonView(Views.Api.class)
        String emoji;
        @JsonView(Views.Api.class)
        String byUsername;
        @JsonView(Views.Api.class)
        String byName;
        @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm:ssX", timezone = "UTC")
        @JsonView(Views.Api.class)
        Date createdAt;
    }
}
