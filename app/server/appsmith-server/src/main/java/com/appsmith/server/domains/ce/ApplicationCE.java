package com.appsmith.server.domains.ce;

import com.appsmith.external.models.BaseDomain;
import com.appsmith.external.views.Git;
import com.appsmith.external.views.Views;
import com.appsmith.server.constants.ArtifactType;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.ApplicationDetail;
import com.appsmith.server.domains.ApplicationPage;
import com.appsmith.server.domains.GitArtifactMetadata;
import com.appsmith.server.dtos.CustomJSLibContextDTO;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonView;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;
import lombok.experimental.FieldNameConstants;
import org.springframework.data.annotation.Transient;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.util.StringUtils;

import java.io.Serializable;
import java.time.Instant;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

import static com.appsmith.external.helpers.StringUtils.dotted;
import static com.appsmith.server.constants.ResourceModes.EDIT;
import static com.appsmith.server.constants.ResourceModes.VIEW;
import static com.appsmith.server.helpers.DateUtils.ISO_FORMATTER;

@Getter
@Setter
@ToString
@NoArgsConstructor
@Document
@FieldNameConstants
public class ApplicationCE extends BaseDomain implements ArtifactCE {

    @NotNull @JsonView(Views.Public.class)
    String name;

    @JsonView(Views.Public.class)
    String workspaceId;

    // TODO: remove default values from application
    @JsonProperty(access = JsonProperty.Access.READ_ONLY)
    @Deprecated(forRemoval = true)
    @JsonView(Views.Public.class)
    Boolean isPublic = false;

    @JsonView({Views.Public.class, Git.class})
    List<ApplicationPage> pages;

    @JsonView(Views.Internal.class)
    List<ApplicationPage> publishedPages;

    @JsonView(Views.Internal.class)
    @Transient
    Boolean viewMode = false;

    @Transient
    @JsonView({Views.Public.class, Git.class})
    boolean appIsExample = false;

    @Transient
    @JsonView(Views.Public.class)
    long unreadCommentThreads;

    @JsonView(Views.Internal.class)
    String clonedFromApplicationId;

    @JsonView({Views.Internal.class, Git.class})
    ApplicationDetail unpublishedApplicationDetail;

    @JsonView(Views.Internal.class)
    ApplicationDetail publishedApplicationDetail;

    @JsonView({Views.Public.class, Git.class})
    String color;

    @JsonView({Views.Public.class, Git.class})
    String icon;

    @JsonView(Views.Public.class)
    private String slug;

    @JsonView({Views.Internal.class, Git.class})
    Application.AppLayout unpublishedAppLayout;

    @JsonView(Views.Internal.class)
    Application.AppLayout publishedAppLayout;

    @JsonView(Views.Public.class)
    Set<CustomJSLibContextDTO> unpublishedCustomJSLibs;

    @JsonView(Views.Public.class)
    Set<CustomJSLibContextDTO> publishedCustomJSLibs;

    @JsonView(Views.Public.class)
    GitArtifactMetadata gitApplicationMetadata;

    @JsonProperty(access = JsonProperty.Access.READ_ONLY)
    @JsonView(Views.Public.class)
    Instant lastDeployedAt; // when this application was last deployed

    @JsonProperty(access = JsonProperty.Access.READ_ONLY)
    @JsonView({Views.Public.class, Git.class})
    Integer evaluationVersion;

    /**
     * applicationVersion will be used when we've a breaking change in application, and it's not possible to write a
     * migration. User need to update the application manually.
     * In such cases, we can use this field to determine whether we need to notify user about that breaking change
     * so that they can update their application.
     * Once updated, we should set applicationVersion to latest version as well.
     */
    @JsonView({Views.Public.class, Git.class})
    Integer applicationVersion;

    /**
     * Changing name, change in pages, widgets and datasources will set lastEditedAt.
     * Other activities e.g. changing policy will not change this property.
     * We're adding JsonIgnore here because it'll be exposed as modifiedAt to keep it backward compatible
     */
    @JsonView(Views.Internal.class)
    Instant lastEditedAt;

    @JsonView({Views.Public.class, Git.class})
    Application.EmbedSetting embedSetting;

    @JsonView({Views.Public.class, Git.class})
    Boolean collapseInvisibleWidgets;

    /**
     * Earlier this was returning value of the updatedAt property in the base domain.
     * As this property is modified by the framework when there is any change in domain,
     * a new property lastEditedAt has been added to track the edit actions from users.
     * This method exposes that property.
     *
     * @return updated time as a string
     */
    @JsonProperty(value = "modifiedAt", access = JsonProperty.Access.READ_ONLY)
    @JsonView(Views.Public.class)
    public String getLastUpdateTime() {
        if (lastEditedAt != null) {
            return ISO_FORMATTER.format(lastEditedAt);
        }
        return null;
    }

    @JsonView(Views.Public.class)
    public String getLastDeployedAt() {
        if (lastDeployedAt != null) {
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
    @JsonView({Views.Internal.class, Git.class})
    Integer clientSchemaVersion;

    @JsonView({Views.Internal.class, Git.class})
    Integer serverSchemaVersion;

    @JsonView(Views.Internal.class)
    String publishedModeThemeId;

    @JsonView(Views.Internal.class)
    String editModeThemeId;

    // TODO Temporary provision for exporting the application with datasource configuration for the sample/template apps
    @JsonView(Views.Public.class)
    Boolean exportWithConfiguration;

    // forkWithConfiguration represents whether credentials are shared or not while forking an app
    @JsonView(Views.Public.class)
    Boolean forkWithConfiguration;

    // isCommunityTemplate represents whether this application has been published as a community template
    @JsonView(Views.Public.class)
    Boolean isCommunityTemplate;

    /* Template title of the template from which this app was forked, if any */
    @JsonView(Views.Public.class)
    String forkedFromTemplateTitle;

    // This constructor is used during clone application. It only deeply copies selected fields. The rest are either
    // initialized newly or is left up to the calling function to set.
    public ApplicationCE(ApplicationCE application) {
        super();
        this.workspaceId = application.getWorkspaceId();
        this.pages = new ArrayList<>();
        this.publishedPages = new ArrayList<>();
        this.clonedFromApplicationId = application.getId();
        this.color = application.getColor();
        this.icon = application.getIcon();
        this.unpublishedAppLayout = application.getUnpublishedAppLayout() == null
                ? null
                : new Application.AppLayout(application.getUnpublishedAppLayout().type);
        this.publishedAppLayout = application.getPublishedAppLayout() == null
                ? null
                : new Application.AppLayout(application.getPublishedAppLayout().type);
        this.setUnpublishedApplicationDetail(new ApplicationDetail());
        this.setPublishedApplicationDetail(new ApplicationDetail());
        if (application.getUnpublishedApplicationDetail() == null) {
            application.setUnpublishedApplicationDetail(new ApplicationDetail());
        }
        if (application.getPublishedApplicationDetail() == null) {
            application.setPublishedApplicationDetail(new ApplicationDetail());
        }

        Application.AppPositioning unpublishedAppPositioning =
                application.getUnpublishedApplicationDetail().getAppPositioning() == null
                        ? null
                        : new Application.AppPositioning(
                                application.getUnpublishedApplicationDetail().getAppPositioning().type);
        this.getUnpublishedApplicationDetail().setAppPositioning(unpublishedAppPositioning);
        Application.AppPositioning publishedAppPositioning =
                application.getPublishedApplicationDetail().getAppPositioning() == null
                        ? null
                        : new Application.AppPositioning(
                                application.getPublishedApplicationDetail().getAppPositioning().type);
        this.getPublishedApplicationDetail().setAppPositioning(publishedAppPositioning);
        this.getUnpublishedApplicationDetail()
                .setNavigationSetting(
                        application.getUnpublishedApplicationDetail().getNavigationSetting() == null
                                ? null
                                : new Application.NavigationSetting());
        this.getPublishedApplicationDetail()
                .setNavigationSetting(
                        application.getPublishedApplicationDetail().getNavigationSetting() == null
                                ? null
                                : new Application.NavigationSetting());
        this.getUnpublishedApplicationDetail()
                .setThemeSetting(
                        application.getUnpublishedApplicationDetail().getThemeSetting() == null
                                ? null
                                : new Application.ThemeSetting());
        this.getPublishedApplicationDetail()
                .setThemeSetting(
                        application.getPublishedApplicationDetail().getThemeSetting() == null
                                ? null
                                : new Application.ThemeSetting());
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

    @Override
    public String getBaseId() {
        if (this.getGitArtifactMetadata() != null
                && StringUtils.hasLength(this.getGitArtifactMetadata().getDefaultArtifactId())) {
            return this.getGitArtifactMetadata().getDefaultArtifactId();
        }
        return ArtifactCE.super.getBaseId();
    }

    @JsonView(Views.Internal.class)
    @Override
    public GitArtifactMetadata getGitArtifactMetadata() {
        return this.gitApplicationMetadata;
    }

    @JsonView(Views.Internal.class)
    @Override
    public void setGitArtifactMetadata(GitArtifactMetadata gitArtifactMetadata) {
        this.gitApplicationMetadata = gitArtifactMetadata;
    }

    @Override
    public String getUnpublishedThemeId() {
        return this.getEditModeThemeId();
    }

    @Override
    public void setUnpublishedThemeId(String themeId) {
        this.setEditModeThemeId(themeId);
    }

    @Override
    public String getPublishedThemeId() {
        return this.getPublishedModeThemeId();
    }

    @Override
    public void setPublishedThemeId(String themeId) {
        this.setPublishedModeThemeId(themeId);
    }

    @Override
    public void sanitiseToExportDBObject() {
        this.setWorkspaceId(null);
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
        this.setPublishedCustomJSLibs(new HashSet<>());
        this.setExportWithConfiguration(null);
        this.setForkWithConfiguration(null);
        this.setForkingEnabled(null);
        super.sanitiseToExportDBObject();
    }

    public List<ApplicationPage> getPages() {
        return Boolean.TRUE.equals(viewMode) ? publishedPages : pages;
    }

    public Application.AppLayout getAppLayout() {
        return Boolean.TRUE.equals(viewMode) ? publishedAppLayout : unpublishedAppLayout;
    }

    public void setAppLayout(Application.AppLayout appLayout) {
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

    @Override
    @JsonView({Views.Internal.class})
    public ArtifactType getArtifactType() {
        return ArtifactType.APPLICATION;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AppLayoutCE implements Serializable {
        @JsonView({Views.Public.class, Git.class})
        protected Type type;

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
    public static class EmbedSettingCE {

        @JsonView({Views.Public.class, Git.class})
        private String height;

        @JsonView({Views.Public.class, Git.class})
        private String width;

        @JsonView({Views.Public.class, Git.class})
        private Boolean showNavigationBar;
    }

    /**
     * NavigationSetting stores the navigation configuration for the app
     */
    @Data
    public static class NavigationSettingCE {
        @JsonView({Views.Public.class, Git.class})
        private Boolean showNavbar;

        @JsonView({Views.Public.class, Git.class})
        private String orientation;

        @JsonView({Views.Public.class, Git.class})
        private String navStyle;

        @JsonView({Views.Public.class, Git.class})
        private String position;

        @JsonView({Views.Public.class, Git.class})
        private String itemStyle;

        @JsonView({Views.Public.class, Git.class})
        private String colorStyle;

        @JsonView({Views.Public.class, Git.class})
        private String logoAssetId;

        @JsonView({Views.Public.class, Git.class})
        private String logoConfiguration;

        @JsonView({Views.Public.class, Git.class})
        private Boolean showSignIn;
    }

    /**
     * AppPositioning captures widget positioning Mode of the application
     */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AppPositioningCE {
        @JsonView({Views.Public.class, Git.class})
        protected Type type;

        public AppPositioningCE(String type) {
            setType(Type.valueOf(type));
        }

        public enum Type {
            FIXED,
            AUTO,
            ANVIL
        }
    }

    @Data
    @NoArgsConstructor
    public static class ThemeSettingCE {

        @JsonView({Views.Public.class, Git.class})
        private String accentColor;

        @JsonView({Views.Public.class, Git.class})
        private String borderRadius;

        @JsonView({Views.Public.class, Git.class})
        private float sizing = 1;

        @JsonView({Views.Public.class, Git.class})
        private float density = 1;

        @JsonView({Views.Public.class, Git.class})
        private String fontFamily;

        @JsonView({Views.Public.class, Git.class})
        protected Type colorMode;

        @JsonView({Views.Public.class, Git.class})
        IconStyle iconStyle;

        @JsonView({Views.Public.class, Git.class})
        AppMaxWidth appMaxWidth = AppMaxWidth.LARGE;

        public ThemeSettingCE(Type colorMode) {
            this.colorMode = colorMode;
        }

        public enum Type {
            LIGHT,
            DARK
        }

        public enum IconStyle {
            OUTLINED,
            FILLED
        }

        public enum AppMaxWidth {
            UNLIMITED,
            LARGE,
            MEDIUM,
        }
    }

    public static class Fields extends BaseDomain.Fields {
        public static final String gitApplicationMetadata_gitAuth =
                dotted(gitApplicationMetadata, GitArtifactMetadata.Fields.gitAuth);
        public static final String gitApplicationMetadata_defaultApplicationId =
                dotted(gitApplicationMetadata, GitArtifactMetadata.Fields.defaultApplicationId);
        public static final String gitApplicationMetadata_defaultArtifactId =
                dotted(gitApplicationMetadata, GitArtifactMetadata.Fields.defaultArtifactId);
        public static final String gitApplicationMetadata_branchName =
                dotted(gitApplicationMetadata, GitArtifactMetadata.Fields.branchName);
        public static final String gitApplicationMetadata_isRepoPrivate =
                dotted(gitApplicationMetadata, GitArtifactMetadata.Fields.isRepoPrivate);
        public static final String gitApplicationMetadata_isProtectedBranch =
                dotted(gitApplicationMetadata, GitArtifactMetadata.Fields.isProtectedBranch);
    }
}
