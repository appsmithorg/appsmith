package com.appsmith.server.domains;

import com.appsmith.external.models.BaseDomain;
import com.appsmith.server.helpers.DateUtils;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.data.mongodb.core.mapping.Document;

/**
 * This stores a snapshot of an application. If a snapshot is more than 15 MB, we'll break it into smaller chunks.
 * Both the root chunk and the child chunks will be stored in this collection.
 * We'll use some attributes to create and maintain the sequence of the chunks.
 */
@Getter
@Setter
@NoArgsConstructor
@Document
public class ApplicationSnapshot extends BaseDomain {
    private String applicationId;

    /**
     * binary data, will be present always
     */
    private byte [] data;

    /**
     * chunkOrder: present only in child chunks. Used to maintain the order of the chunks.
     * if a parent has 3 child chunks, the first one will have chunkOrder=1, second one 2 and third one 3
     */
    private int chunkOrder;

    /**
     * Adding this method as updatedAt field in BaseDomain is annotated with @JsonIgnore
     * @return Updated at timestamp in ISO format
     */
    public String getUpdatedTime() {
        return DateUtils.ISO_FORMATTER.format(this.getUpdatedAt());
    }
}
