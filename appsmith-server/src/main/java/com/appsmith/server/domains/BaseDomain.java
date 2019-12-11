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
import org.springframework.data.domain.Persistable;

import java.util.Date;

@Getter
@Setter
@ToString
public abstract class BaseDomain implements Persistable<String> {

    private static final long serialVersionUID = 7459916000501322517L;

    @Id
    private String id;

    @CreatedDate
    protected Date createdAt;

    @LastModifiedDate
    protected Date updatedAt = new Date();

    @CreatedBy
    protected String createdBy;

    @LastModifiedBy
    protected String modifiedBy;

    protected Boolean deleted = false;

    @JsonIgnore
    @Override
    public boolean isNew() {
        return this.getId() == null;
    }

}
