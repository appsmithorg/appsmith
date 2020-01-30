package com.appsmith.server.domains;

import com.fasterxml.jackson.annotation.JsonIgnore;
import lombok.Getter;
import lombok.Setter;
import lombok.ToString;
import org.springframework.data.annotation.CreatedBy;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedBy;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.annotation.Version;
import org.springframework.data.domain.Persistable;
import org.springframework.data.mongodb.core.index.Indexed;

import java.time.Instant;

@Getter
@Setter
@ToString
public abstract class BaseDomain implements Persistable<String> {

    private static final long serialVersionUID = 7459916000501322517L;

    @Id
    private String id;

    @JsonIgnore
    @Indexed
    @CreatedDate
    protected Instant createdAt;

    @JsonIgnore
    @LastModifiedDate
    protected Instant updatedAt;

    @CreatedBy
    protected String createdBy;

    @LastModifiedBy
    protected String modifiedBy;

    protected Boolean deleted = false;

    @JsonIgnore
    @Version
    protected Long documentVersion;

    @JsonIgnore
    @Override
    public boolean isNew() {
        return this.getId() == null;
    }

}
