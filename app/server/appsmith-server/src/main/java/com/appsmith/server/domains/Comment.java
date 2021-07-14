package com.appsmith.server.domains;

import com.appsmith.external.models.BaseDomain;
import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;
import lombok.EqualsAndHashCode;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.Date;
import java.util.List;
import java.util.Map;

import static com.appsmith.server.helpers.DateUtils.ISO_FORMATTER;

@Data
@EqualsAndHashCode(callSuper = false)
@Document
public class Comment extends BaseDomain {

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

    @JsonProperty(access = JsonProperty.Access.READ_ONLY)
    String authorUsername;

    private String applicationId;
    private String applicationName;
    private String pageId;

    Body body;

    /** Edit/Published Mode */
    String mode;

    List<Reaction> reactions;

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

    public String getCreationTime() {
        return ISO_FORMATTER.format(createdAt);
    }

    @Data
    public static class Reaction {
        String emoji;
        String byUsername;
        String byName;
        @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm:ssX", timezone = "UTC")
        Date createdAt;
    }
}
