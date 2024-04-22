package com.appsmith.server.domains.ce;

import com.appsmith.external.helpers.CustomJsonType;
import com.appsmith.server.domains.Application;
import jakarta.persistence.Column;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.Setter;
import lombok.ToString;
import org.hibernate.annotations.Type;

@Getter
@Setter
@ToString
@EqualsAndHashCode
public class ApplicationDetailCE {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Type(CustomJsonType.class)
    @Column(columnDefinition = "jsonb")
    private Application.AppPositioning appPositioning;

    @Type(CustomJsonType.class)
    @Column(columnDefinition = "jsonb")
    private Application.NavigationSetting navigationSetting;

    @Type(CustomJsonType.class)
    @Column(columnDefinition = "jsonb")
    Application.ThemeSetting themeSetting;

    public ApplicationDetailCE() {
        this.appPositioning = null;
        this.navigationSetting = null;
        this.themeSetting = null;
    }
}
