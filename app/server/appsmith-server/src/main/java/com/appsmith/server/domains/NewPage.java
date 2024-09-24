package com.appsmith.server.domains;

import com.appsmith.external.models.BranchAwareDomain;
import com.appsmith.external.views.Git;
import com.appsmith.external.views.Views;
import com.appsmith.server.dtos.PageDTO;
import com.fasterxml.jackson.annotation.JsonView;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.FieldNameConstants;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@Document
@FieldNameConstants
public class NewPage extends BranchAwareDomain implements Context {
    @JsonView(Views.Public.class)
    String applicationId;

    @JsonView({Views.Public.class, Git.class})
    PageDTO unpublishedPage;

    @JsonView(Views.Public.class)
    PageDTO publishedPage;

    @Override
    public void sanitiseToExportDBObject() {
        this.setApplicationId(null);
        this.setId(null);
        if (this.getUnpublishedPage() != null) {
            this.getUnpublishedPage().sanitiseToExportDBObject();
        }
        if (this.getPublishedPage() != null) {
            this.getPublishedPage().sanitiseToExportDBObject();
        }
        super.sanitiseToExportDBObject();
    }

    @JsonView(Views.Internal.class)
    @Override
    public String getArtifactId() {
        return this.applicationId;
    }

    @JsonView(Views.Internal.class)
    @Override
    public Layout getLayout() {
        if (this.getUnpublishedPage() == null || this.getUnpublishedPage().getLayouts() == null) {
            return null;
        }
        List<Layout> layouts = this.getUnpublishedPage().getLayouts();
        return !layouts.isEmpty() ? layouts.get(0) : null;
    }

    @JsonView(Views.Internal.class)
    @Override
    public String getUnpublishedName() {
        if (this.getUnpublishedPage() == null) {
            return null;
        }
        return this.getUnpublishedPage().getName();
    }

    public static class Fields extends BranchAwareDomain.Fields {
        public static String unpublishedPage_layouts = unpublishedPage + "." + PageDTO.Fields.layouts;
        public static String unpublishedPage_name = unpublishedPage + "." + PageDTO.Fields.name;
        public static String unpublishedPage_icon = unpublishedPage + "." + PageDTO.Fields.icon;
        public static String unpublishedPage_isHidden = unpublishedPage + "." + PageDTO.Fields.isHidden;
        public static String unpublishedPage_slug = unpublishedPage + "." + PageDTO.Fields.slug;
        public static String unpublishedPage_customSlug = unpublishedPage + "." + PageDTO.Fields.customSlug;
        public static String unpublishedPage_deletedAt = unpublishedPage + "." + PageDTO.Fields.deletedAt;
        public static String unpublishedPage_dependencyMap = unpublishedPage + "." + PageDTO.Fields.dependencyMap;

        public static String publishedPage_layouts = publishedPage + "." + PageDTO.Fields.layouts;
        public static String publishedPage_name = publishedPage + "." + PageDTO.Fields.name;
        public static String publishedPage_icon = publishedPage + "." + PageDTO.Fields.icon;
        public static String publishedPage_isHidden = publishedPage + "." + PageDTO.Fields.isHidden;
        public static String publishedPage_slug = publishedPage + "." + PageDTO.Fields.slug;
        public static String publishedPage_customSlug = publishedPage + "." + PageDTO.Fields.customSlug;
    }
}
