package com.appsmith.server.domains;

import com.appsmith.external.models.BaseDomain;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.querydsl.core.annotations.QueryEntity;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;
import org.springframework.data.annotation.Transient;
import org.springframework.data.mongodb.core.mapping.Document;

import javax.validation.constraints.NotNull;
import java.io.Serializable;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

import static com.appsmith.server.helpers.DateUtils.ISO_FORMATTER;

@Getter
@Setter
@ToString
@NoArgsConstructor
@QueryEntity
@Document
public class Application extends BaseDomain {

    @NotNull
    String name;

    String organizationId;

    @JsonProperty(access = JsonProperty.Access.READ_ONLY)
    Boolean isPublic = false;

    List<ApplicationPage> pages;

    @JsonIgnore
    List<ApplicationPage> publishedPages;

    @JsonIgnore
    @Transient
    Boolean viewMode = false;

    @Transient
    boolean appIsExample = false;

    @Transient
    long unreadCommentThreads;

    @JsonIgnore
    String clonedFromApplicationId;

    String color;

    String icon;

    private String slug;

    @JsonIgnore
    AppLayout unpublishedAppLayout;

    @JsonIgnore
    AppLayout publishedAppLayout;

    GitApplicationMetadata gitApplicationMetadata;

    @JsonProperty(access = JsonProperty.Access.READ_ONLY)
    Instant lastDeployedAt; // when this application was last deployed

    /**
     * This method has been added because the updatedAt property in base domain has @JsonIgnore annotation
     * @return updated time as a string
     */
    @JsonProperty(value = "modifiedAt", access = JsonProperty.Access.READ_ONLY)
    public String getLastUpdateTime() {
        if(updatedAt != null) {
            return ISO_FORMATTER.format(updatedAt);
        }
        return null;
    }

    public String getLastDeployedAt() {
        if(lastDeployedAt != null) {
            return ISO_FORMATTER.format(lastDeployedAt);
        }
        return null;
    }

    Boolean forkingEnabled;

    // This constructor is used during clone application. It only deeply copies selected fields. The rest are either
    // initialized newly or is left up to the calling function to set.
    public Application(Application application) {
        super();
        this.organizationId = application.getOrganizationId();
        this.pages = new ArrayList<>();
        this.publishedPages = new ArrayList<>();
        this.clonedFromApplicationId = application.getId();
        this.color = application.getColor();
        this.icon = application.getIcon();
        this.unpublishedAppLayout = application.getUnpublishedAppLayout() == null ? null : new AppLayout(application.getUnpublishedAppLayout().type);
        this.publishedAppLayout = application.getPublishedAppLayout() == null ? null : new AppLayout(application.getPublishedAppLayout().type);
    }

    public List<ApplicationPage> getPages() {
        return Boolean.TRUE.equals(viewMode) ? publishedPages : pages;
    }

    public AppLayout getAppLayout() {
        return Boolean.TRUE.equals(viewMode) ? publishedAppLayout : unpublishedAppLayout;
    }

    public void setAppLayout(AppLayout appLayout) {
        if (Boolean.TRUE.equals(viewMode)) {
            publishedAppLayout = appLayout;
        } else {
            unpublishedAppLayout = appLayout;
        }
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AppLayout implements Serializable {
        Type type;

        /**
         * @deprecated The following field is deprecated and now removed, because it's needed in a migration. After the
         * migration has been run, it may be removed (along with the migration or there'll be compile errors there).
         */
        @JsonIgnore
        @Deprecated(forRemoval = true)
        Integer width = null;

        public AppLayout(Type type) {
            this.type = type;
        }

        public enum Type {
            DESKTOP,
            TABLET_LARGE,
            TABLET,
            MOBILE,
            FLUID,
        }
    }

}
