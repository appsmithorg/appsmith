package com.appsmith.server.domains;

import com.appsmith.external.models.BaseDomain;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.querydsl.core.annotations.QueryEntity;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;
import org.springframework.data.annotation.Transient;
import org.springframework.data.mongodb.core.mapping.Document;

import javax.validation.constraints.NotNull;
import java.util.ArrayList;
import java.util.List;

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

    @JsonIgnore
    String clonedFromApplicationId;

    String color;

    String icon;

    public Application(String name,
                       String organizationId,
                       Boolean isPublic,
                       ArrayList<ApplicationPage> pages,
                       ArrayList<ApplicationPage> publishedPages,
                       String clonedFromApplicationId,
                       String color,
                       String icon) {
        super();
        this.name = name;
        this.organizationId = organizationId;
        this.isPublic = isPublic;
        this.pages = pages;
        this.publishedPages = publishedPages;
        this.clonedFromApplicationId = clonedFromApplicationId;
        this.color = color;
        this.icon = icon;
    }

    public List<ApplicationPage> getPages() {
        return viewMode ? publishedPages : pages;
    }

}
