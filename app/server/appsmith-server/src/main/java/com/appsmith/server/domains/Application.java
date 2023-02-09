package com.appsmith.server.domains;

import com.appsmith.external.models.BaseDomain;
import com.appsmith.server.dtos.ApplicationDTO;
import com.appsmith.server.dtos.CustomJSLibApplicationDTO;
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
    String name;

    //Organizations migrated to workspaces, kept the field as deprecated to support the old migration
    @Deprecated
    String organizationId;

    String workspaceId;

    /*
    TODO: remove default values from application.
     */
    @JsonProperty(access = JsonProperty.Access.READ_ONLY)
    @Deprecated(forRemoval = true)
    Boolean isPublic = false;

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

    GitApplicationMetadata gitApplicationMetadata;

    @JsonProperty(access = JsonProperty.Access.READ_ONLY)
    Instant lastDeployedAt; // when this application was last deployed

    @JsonProperty(access = JsonProperty.Access.READ_ONLY)
    Integer evaluationVersion;

    /**
     * applicationVersion will be used when we've a breaking change in application, and it's not possible to write a
     * migration. User need to update the application manually.
     * In such cases, we can use this field to determine whether we need to notify user about that breaking change
     * so that they can update their application.
     * Once updated, we should set applicationVersion to latest version as well.
     */
    Integer applicationVersion;

    /**
     * Changing name, change in pages, widgets and datasources will set lastEditedAt.
     * Other activities e.g. changing policy will not change this property.
     * We're adding JsonIgnore here because it'll be exposed as modifiedAt to keep it backward compatible
     */
    @JsonIgnore
    Instant lastEditedAt;

    EmbedSetting embedSetting;

    Boolean collapseInvisibleWidgets;

    ApplicationDTO unpublishedApplication;

    ApplicationDTO publishedApplication;

    /**
     * Earlier this was returning value of the updatedAt property in the base domain.
     * As this property is modified by the framework when there is any change in domain,
     * a new property lastEditedAt has been added to track the edit actions from users.
     * This method exposes that property.
     * @return updated time as a string
     */
    @JsonProperty(value = "modifiedAt", access = JsonProperty.Access.READ_ONLY)
    public String getLastUpdateTime() {
        if(lastEditedAt != null) {
            return ISO_FORMATTER.format(lastEditedAt);
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

    // Field to convey if the application is updated by the user
    Boolean isManualUpdate;

    // Field to convey if the application is modified from the DB migration
    @Transient
    Boolean isAutoUpdate;

    // To convey current schema version for client and server. This will be used to check if we run the migration
    // between 2 commits if the application is connected to git
    @JsonIgnore
    Integer clientSchemaVersion;

    @JsonIgnore
    Integer serverSchemaVersion;

    // TODO Temporary provision for exporting the application with datasource configuration for the sample/template apps
    Boolean exportWithConfiguration;

    @JsonIgnore
    @Deprecated
    String defaultPermissionGroup;

    // This constructor is used during clone application. It only deeply copies selected fields. The rest are either
    // initialized newly or is left up to the calling function to set.
    public Application(Application application) {
        super();
        this.workspaceId = application.getWorkspaceId();
        this.getUnpublishedApplication().setPages(new ArrayList<>());
        this.getPublishedApplication().setPages(new ArrayList<>());
        this.clonedFromApplicationId = application.getId();
        this.color = application.getColor();
        this.icon = application.getIcon();
        AppLayout unpublishedAppLayout = getUnpublishedApplication().getAppLayout() == null ? null : new AppLayout(getUnpublishedApplication().getAppLayout().type);
        this.getUnpublishedApplication().setAppLayout(unpublishedAppLayout);
        AppLayout publishedAppLayout = getPublishedApplication().getAppLayout() == null ? null : new AppLayout(getPublishedApplication().getAppLayout().type);
        this.getPublishedApplication().setAppLayout(publishedAppLayout);
        AppPositioning unpublishedAppPositioning = application.getUnpublishedApplication().getAppPositioning() == null ? null: new AppPositioning(getUnpublishedApplication().getAppPositioning().type);
        this.getUnpublishedApplication().setAppPositioning(unpublishedAppPositioning);
        AppPositioning publishedAppPositioning = application.getPublishedApplication().getAppPositioning() == null ? null: new AppPositioning(getPublishedApplication().getAppPositioning().type);
        this.getPublishedApplication().setAppPositioning(publishedAppPositioning);
        this.getUnpublishedApplication().setNavigationSetting(application.getUnpublishedApplication().getNavigationSetting() == null ? null: new NavigationSetting());
        this.getPublishedApplication().setNavigationSetting(getPublishedApplication().getNavigationSetting() == null ? null: new NavigationSetting());
        this.getUnpublishedApplication().setCustomJSLibs(getUnpublishedApplication().getCustomJSLibs());
        this.collapseInvisibleWidgets = application.getCollapseInvisibleWidgets();
    }

    public void exportApplicationPages(final Map<String, String> pageIdToNameMap) {
        for (ApplicationPage applicationPage : this.getPages()) {
            applicationPage.setId(pageIdToNameMap.get(applicationPage.getId() + EDIT));
            applicationPage.setDefaultPageId(null);
        }
        for (ApplicationPage applicationPage : this.getPublishedApplication().getPages()) {
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
        this.getUnpublishedApplication().setThemeId(null);
        this.getPublishedApplication().setThemeId(null);
        this.setClientSchemaVersion(null);
        this.setServerSchemaVersion(null);
        this.setIsManualUpdate(false);
        this.sanitiseToExportBaseObject();
        this.setDefaultPermissionGroup(null);
        this.getPublishedApplication().setCustomJSLibs(new HashSet<>());
    }



    public AppLayout getAppLayout() {
        return Boolean.TRUE.equals(viewMode) ? getPublishedApplication().getAppLayout() : getUnpublishedApplication().getAppLayout();
    }

    public void setAppLayout(AppLayout appLayout) {
        if (Boolean.TRUE.equals(viewMode)) {
            getPublishedApplication().setAppLayout(appLayout);
        } else {
            getUnpublishedApplication().setAppLayout(appLayout);
        }
    }

    public ApplicationDTO getUnpublishedApplication() {
        return unpublishedApplication == null ? new ApplicationDTO() : unpublishedApplication;
    }

    public ApplicationDTO getPublishedApplication() {
        return publishedApplication == null ? new ApplicationDTO() : publishedApplication;
    }

    public List<ApplicationPage> getPages() {
        return Boolean.TRUE.equals(viewMode) ? getPublishedApplication().getPages() : getUnpublishedApplication().getPages();
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

    /**
     * EmbedSetting is used for embedding Appsmith apps on other platforms
     */
    @Data
    public static class EmbedSetting {
        private String height;
        private String width;
        private Boolean showNavigationBar;
    }

    public NavigationSetting getNavigationSetting() {
        return Boolean.TRUE.equals(viewMode) ? getPublishedApplication().getNavigationSetting() : getUnpublishedApplication().getNavigationSetting();
    }

    public void setNavigationSetting(NavigationSetting navigationSetting) {
        if (Boolean.TRUE.equals(viewMode)) {
            getPublishedApplication().setNavigationSetting(navigationSetting);
        } else {
            getUnpublishedApplication().setNavigationSetting(navigationSetting);
        }
    }

    /**
     * NavigationSetting stores the navigation configuration for the app
     */
    @Data
    public static class NavigationSetting {
        private Boolean showNavbar;
        private String orientation;
        private String navStyle;
        private String position;
        private String itemStyle;
        private String colorStyle;
        private String logoAssetId;
        private String logoConfiguration;
        private Boolean showSignIn;
    }

    public AppPositioning getAppPositioning() {
        return Boolean.TRUE.equals(viewMode) ? getPublishedApplication().getAppPositioning() : getUnpublishedApplication().getAppPositioning();
    }

    public void setAppPositioning(AppPositioning appPositioning) {
        if (Boolean.TRUE.equals(viewMode)) {
            getPublishedApplication().setAppPositioning(appPositioning);
        } else {
            getUnpublishedApplication().setAppPositioning(appPositioning);
        }
    }

    /**
     * AppPositioning captures widget positioning Mode of the application
     */
    @Data
    @NoArgsConstructor
    public static class AppPositioning {
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
