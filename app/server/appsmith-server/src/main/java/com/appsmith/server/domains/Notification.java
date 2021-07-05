package com.appsmith.server.domains;

import com.appsmith.external.models.BaseDomain;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;
import lombok.EqualsAndHashCode;
import org.springframework.data.mongodb.core.mapping.Document;

import static com.appsmith.server.helpers.DateUtils.ISO_FORMATTER;

@Data
@EqualsAndHashCode(callSuper = true)
@Document
public class Notification extends BaseDomain {

    // TODO: This class extends BaseDomain, so it has policies. Should we use information from policies instead of this field?
    String forUsername;

    /**
     * Read status for this notification. If it is `true`, then this notification is read. If `false` or `null`, it's unread.
     */
    Boolean isRead;

    public String getType() {
        return getClass().getSimpleName();
    }

    /**
     * This method has been added because the createdAt property in base domain has @JsonIgnore annotation
     * @return created time as a string
     */
    @JsonProperty(value = "createdAt", access = JsonProperty.Access.READ_ONLY)
    public String getCreationTime() {
        return ISO_FORMATTER.format(createdAt);
    }
}
