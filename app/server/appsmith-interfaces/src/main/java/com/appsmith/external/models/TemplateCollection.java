package com.appsmith.external.models;

import com.appsmith.external.views.Views;
import com.fasterxml.jackson.annotation.JsonView;
import com.vladmihalcea.hibernate.type.json.JsonBinaryType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;
import org.hibernate.annotations.Type;
import org.springframework.data.annotation.CreatedBy;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedBy;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.annotation.Transient;
import org.springframework.data.annotation.Version;
import org.springframework.data.domain.Persistable;
import org.springframework.data.mongodb.core.index.Indexed;

import java.time.Instant;
import java.util.List;

@Getter
@Setter
@ToString
@NoArgsConstructor
@Entity
public class TemplateCollection implements Persistable<String> {
    private static final long serialVersionUID = 7459916000501322517L;

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    String id;

    @JsonView(Views.Internal.class)
    @Indexed
    @CreatedDate
    protected Instant createdAt;

    @JsonView(Views.Internal.class)
    @LastModifiedDate
    protected Instant updatedAt;

    @CreatedBy
    @JsonView(Views.Public.class)
    protected String createdBy;

    @LastModifiedBy
    @JsonView(Views.Public.class)
    protected String modifiedBy;

    @JsonView(Views.Public.class)
    protected Boolean deleted = false;

    @JsonView(Views.Internal.class)
    @Version
    protected Long documentVersion;

    @JsonView(Views.Internal.class)
    @Override
    public boolean isNew() {
        return this.getId() == null;
    }

    // TemplateCollection fields below :
    @JsonView(Views.Public.class)
    String name;

    @JsonView(Views.Internal.class)
    @Type(JsonBinaryType.class)
    @Column(columnDefinition = "jsonb")
    List<String> apiTemplateIds;

    @Transient
    @JsonView(Views.Public.class)
    @OneToMany
    List<ApiTemplate> apiTemplateList;
}
