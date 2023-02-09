package com.appsmith.server.dtos;

import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.ApplicationPage;
import com.fasterxml.jackson.annotation.JsonIgnore;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;
import org.springframework.data.annotation.Transient;

import java.util.List;
import java.util.Set;

@Getter
@Setter
@NoArgsConstructor
@ToString
public class ApplicationDTO {

    @Transient
    private String id;

    @JsonIgnore
    Application.AppLayout appLayout;

    Set<CustomJSLibApplicationDTO> customJSLibs;

    @JsonIgnore
    Application.NavigationSetting navigationSetting;

    @JsonIgnore
    Application.AppPositioning appPositioning;

    List<ApplicationPage> pages;

    @JsonIgnore
    String themeId;

}
