package com.appsmith.external.models;

import com.fasterxml.jackson.annotation.JsonIgnore;
import lombok.Getter;
import lombok.NoArgsConstructor;
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
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.util.List;

@Getter
@Setter
@ToString
@NoArgsConstructor
@Document
public class Provider implements Persistable<String> {

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

    // Provider details here
    String name; //Provider name here
    String description; //Provider company's description here
    String url;
    String imageUrl;
    String documentationUrl; //URL which points to the homepage of the documentations here
    String credentialSteps; //How to generate/get the credentials to run the APIs which belong to this provider
    List<String> categories; //Category names here
    Statistics statistics; //Cumulative statistics for all the APIs for this provider
}
