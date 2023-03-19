package com.appsmith.server.domains;

import com.appsmith.external.models.BaseDomain;
import com.appsmith.external.views.Views;
import com.appsmith.server.dtos.CustomJSLibApplicationDTO;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonView;
import com.querydsl.core.annotations.QueryEntity;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;
import org.springframework.data.annotation.Transient;
import org.springframework.data.mongodb.core.mapping.Document;

import jakarta.validation.constraints.NotNull;
import java.io.Serializable;
import java.time.Instant;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

import static com.appsmith.server.constants.ResourceModes.EDIT;
import static com.appsmith.server.constants.ResourceModes.VIEW;
import static com.appsmith.server.helpers.DateUtils.ISO_FORMATTER;

@Getter
@Setter
@ToString
@NoArgsConstructor
@QueryEntity
@Document
public class Application extends BaseDomain {

    @NotNull
    @JsonView(Views.Public.class)
    String name;

    //Organizations migrated to workspaces, kept the field as deprecated to support the old migration
    @Deprecated
    @JsonView(Views.Public.class)
    String organizationId;

    @JsonView(Views.Public.class)
    String workspaceId;

    /*
    TODO: remove default values from application.
     */
    @JsonProperty(access = JsonProperty.Access.READ_ONLY)
    @Deprecated(forRemoval = true)
    @JsonView(Views.Public.class)
    Boolean isPublic = false;

    @JsonView(Views.Public.class)
    List<ApplicationPage> pages;

    @JsonView(Views.Internal.class)
    List<ApplicationPage> publishedPages;

    @JsonView(Views.Internal.class)
    @Transient
    Boolean viewMode = false;

    @Transient
    @JsonView(Views.Public.class)
    boolean appIsExample = false;

    @Transient
    @JsonView(Views.Public.class)
    long unreadCommentThreads;

    @JsonView(Views.Internal.class)
    String clonedFromApplicationId;

    @JsonView(Views.Internal.class)
    ApplicationDetail unpublishedApplicationDetail;

    @JsonView(Views.Internal.class)
    ApplicationDetail publishedApplicationDetail;

    @JsonView(Views.Public.class)
    String color;

    @JsonView(Views.Public.class)
    String icon;

    @JsonView(Views.Public.class)
    private String slug;

    @JsonView(Views.Internal.class)
    AppLayout unpublishedAppLayout;

    @JsonView(Views.Internal.class)
    AppLayout publishedAppLayout;

    @JsonView(Views.Public.class)
    Set<CustomJSLibApplicationDTO> unpublishedCustomJSLibs;

    @JsonView(Views.Public.class)
    Set<CustomJSLibApplicationDTO> publishedCustomJSLibs;

    @JsonView(Views.Public.class)
    GitApplicationMetadata gitApplicationMetadata;

    @JsonProperty(access = JsonProperty.Access.READ_ONLY)
    @JsonView(Views.Public.class)
    Instant lastDeployedAt; // when this application was last deployed

    @JsonProperty(access = JsonProperty.Access.READ_ONLY)
    @JsonView(Views.Public.class)
    Integer evaluationVersion;

    /**
     * applicationVersion will be used when we've a breaking change in application, and it's not possible to write a
     * migration. User need to update the application manually.
     * In such cases, we can use this field to determine whether we need to notify user about that breaking change
     * so that they can update their application.
     * Once updated, we should set applicationVersion to latest version as well.
     */
    @JsonView(Views.Public.class)
    Integer applicationVersion;

    /**
     * Changing name, change in pages, widgets and datasources will set lastEditedAt.
     * Other activities e.g. changing policy will not change this property.
     * We're adding JsonIgnore here because it'll be exposed as modifiedAt to keep it backward compatible
     */
    @JsonView(Views.Internal.class)
    Instant lastEditedAt;

    @JsonView(Views.Public.class)
    EmbedSetting embedSetting;

    Boolean collapseInvisibleWidgets;

    /**
     * Earlier this was returning value of the updatedAt property in the base domain.
     * As this property is modified by the framework when there is any change in domain,
     * a new property lastEditedAt has been added to track the edit actions from users.
     * This method exposes that property.
     * @return updated time as a string
     */
    @JsonProperty(value = "modifiedAt", access = JsonProperty.Access.READ_ONLY)
    @JsonView(Views.Public.class)
    public String getLastUpdateTime() {
        if(lastEditedAt != null) {
            return ISO_FORMATTER.format(lastEditedAt);
        }
        return null;
    }

    @JsonView(Views.Public.class)
    public String getLastDeployedAt() {
        if(lastDeployedAt != null) {
            return ISO_FORMATTER.format(lastDeployedAt);
        }
        return null;
    }

    @JsonView(Views.Public.class)
    Boolean forkingEnabled;

    // Field to convey if the application is updated by the user
    @JsonView(Views.Public.class)
    Boolean isManualUpdate;

    // Field to convey if the application is modified from the DB migration
    @Transient
    @JsonView(Views.Public.class)
    Boolean isAutoUpdate;

    // To convey current schema version for client and server. This will be used to check if we run the migration
    // between 2 commits if the application is connected to git
    @JsonView(Views.Internal.class)
    Integer clientSchemaVersion;

    @JsonView(Views.Internal.class)
    Integer serverSchemaVersion;

    @JsonView(Views.Internal.class)
    String publishedModeThemeId;

    @JsonView(Views.Internal.class)
    String editModeThemeId;

    // TODO Temporary provision for exporting the application with datasource configuration for the sample/template apps
    @JsonView(Views.Public.class)
    Boolean exportWithConfiguration;

    @JsonView(Views.Internal.class)
    @Deprecated
    String defaultPermissionGroup;

    // This constructor is used during clone application. It only deeply copies selected fields. The rest are either
    // initialized newly or is left up to the calling function to set.
    public Application(Application application) {
        super();
        this.workspaceId = application.getWorkspaceId();
        this.pages = new ArrayList<>();
        this.publishedPages = new ArrayList<>();
        this.clonedFromApplicationId = application.getId();
        this.color = application.getColor();
        this.icon = application.getIcon();
        this.unpublishedAppLayout = application.getUnpublishedAppLayout() == null ? null : new AppLayout(application.getUnpublishedAppLayout().type);
        this.publishedAppLayout = application.getPublishedAppLayout() == null ? null : new AppLayout(application.getPublishedAppLayout().type);
        this.setUnpublishedApplicationDetail(new ApplicationDetail());
        this.setPublishedApplicationDetail(new ApplicationDetail());
        if (application.getUnpublishedApplicationDetail() == null){
            application.setUnpublishedApplicationDetail(new ApplicationDetail());
        }
        if (application.getPublishedApplicationDetail() == null){
            application.setPublishedApplicationDetail(new ApplicationDetail());
        }
        AppPositioning unpublishedAppPositioning = application.getUnpublishedApplicationDetail().getAppPositioning() == null ? null: new AppPositioning(application.getUnpublishedApplicationDetail().getAppPositioning().type);
        this.getUnpublishedApplicationDetail().setAppPositioning(unpublishedAppPositioning);
        AppPositioning publishedAppPositioning = application.getPublishedApplicationDetail().getAppPositioning() == null ? null: new AppPositioning(application.getPublishedApplicationDetail().getAppPositioning().type);
        this.getPublishedApplicationDetail().setAppPositioning(publishedAppPositioning);
        this.getUnpublishedApplicationDetail().setNavigationSetting(application.getUnpublishedApplicationDetail().getNavigationSetting() == null ? null: new NavigationSetting());
        this.getPublishedApplicationDetail().setNavigationSetting(application.getPublishedApplicationDetail().getNavigationSetting() == null ? null: new NavigationSetting());
        this.unpublishedCustomJSLibs = application.getUnpublishedCustomJSLibs();
        this.collapseInvisibleWidgets = application.getCollapseInvisibleWidgets();
    }

    public void exportApplicationPages(final Map<String, String> pageIdToNameMap) {
        for (ApplicationPage applicationPage : this.getPages()) {
            applicationPage.setId(pageIdToNameMap.get(applicationPage.getId() + EDIT));
            applicationPage.setDefaultPageId(null);
        }
        for (ApplicationPage applicationPage : this.getPublishedPages()) {
            applicationPage.setId(pageIdToNameMap.get(applicationPage.getId() + VIEW));
            applicationPage.setDefaultPageId(null);
        }
    }

    public void sanitiseToExportDBObject() {
        this.setWorkspaceId(null);
        this.setOrganizationId(null);
        this.setModifiedBy(null);
        this.setCreatedBy(null);
        this.setLastDeployedAt(null);
        this.setLastEditedAt(null);
        this.setGitApplicationMetadata(null);
        this.setEditModeThemeId(null);
        this.setPublishedModeThemeId(null);
        this.setClientSchemaVersion(null);
        this.setServerSchemaVersion(null);
        this.setIsManualUpdate(false);
        this.sanitiseToExportBaseObject();
        this.setDefaultPermissionGroup(null);
        this.setPublishedCustomJSLibs(new HashSet<>());
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

    public ApplicationDetail getApplicationDetail() {
        return Boolean.TRUE.equals(viewMode) ? publishedApplicationDetail : unpublishedApplicationDetail;
    }

    public void setApplicationDetail(ApplicationDetail applicationDetail) {
        if (Boolean.TRUE.equals(viewMode)) {
            publishedApplicationDetail = applicationDetail;
        } else {
            unpublishedApplicationDetail = applicationDetail;
        }
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AppLayout implements Serializable {
        @JsonView(Views.Public.class)
        Type type;

        /**
         * @deprecated The following field is deprecated and now removed, because it's needed in a migration. After the
         * migration has been run, it may be removed (along with the migration or there'll be compile errors there).
         */
        @JsonView(Views.Internal.class)
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

    /**
     * EmbedSetting is used for embedding Appsmith apps on other platforms
     */
    @Data
    public static class EmbedSetting {

        @JsonView(Views.Public.class)
        private String height;

        @JsonView(Views.Public.class)
        private String width;

        @JsonView(Views.Public.class)
        private Boolean showNavigationBar;
    }

    /**
     * NavigationSetting stores the navigation configuration for the app
     */
    @Data
    public static class NavigationSetting {
        @JsonView(Views.Public.class)
        private Boolean showNavbar;

        @JsonView(Views.Public.class)
        private String orientation;

        @JsonView(Views.Public.class)
        private String navStyle;

        @JsonView(Views.Public.class)
        private String position;

        @JsonView(Views.Public.class)
        private String itemStyle;

        @JsonView(Views.Public.class)
        private String colorStyle;

        @JsonView(Views.Public.class)
        private String logoAssetId;

        @JsonView(Views.Public.class)
        private String logoConfiguration;

        @JsonView(Views.Public.class)
        private Boolean showSignIn;
    }


    /**
     * AppPositioning captures widget positioning Mode of the application
     */
    @Data
    @NoArgsConstructor
    public static class AppPositioning {
        @JsonView(Views.Public.class)
        Type type;

        public AppPositioning(Type type) {
            this.type = type;
        }

        public enum Type {
            FIXED,
            AUTO
        }

    }


}
