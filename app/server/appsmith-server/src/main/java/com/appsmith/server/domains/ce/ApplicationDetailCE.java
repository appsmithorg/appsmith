package com.appsmith.server.domains.ce;

import com.appsmith.server.domains.Application;
import com.vladmihalcea.hibernate.type.json.JsonBinaryType;
import jakarta.persistence.Column;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.MappedSuperclass;
import lombok.Getter;
import lombok.Setter;
import lombok.ToString;
import org.hibernate.annotations.Type;

@Getter
@Setter
@ToString
@MappedSuperclass
public class ApplicationDetailCE {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Type(JsonBinaryType.class)
    @Column(columnDefinition = "jsonb")
    private Application.AppPositioning appPositioning;

    @Type(JsonBinaryType.class)
    @Column(columnDefinition = "jsonb")
    private Application.NavigationSetting navigationSetting;

    public ApplicationDetailCE() {
        this.appPositioning = null;
        this.navigationSetting = null;
    }
}
