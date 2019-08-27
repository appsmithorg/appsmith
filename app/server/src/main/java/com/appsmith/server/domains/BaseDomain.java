package com.appsmith.server.domains;

import lombok.Getter;
import lombok.Setter;
import lombok.ToString;
import org.springframework.data.annotation.*;
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
    protected Date updatedAt;

    @CreatedBy
    protected String createdBy;

    @LastModifiedBy
    protected String modifiedBy;

    protected Boolean deleted = false;

    @Override
    public boolean isNew() {
        return this.getId() == null;
    }

}
