package com.appsmith.server.domains;

import com.appsmith.external.models.BaseDomain;
import com.appsmith.server.services.AclEntity;
import com.querydsl.core.annotations.QueryEntity;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.mapping.Document;

import javax.validation.constraints.NotNull;
import java.util.List;

@Getter
@Setter
@ToString
@NoArgsConstructor
@QueryEntity
@Document
@CompoundIndex(def = "{'organizationId':1, 'name':1}", name = "organization_application_compound_index", unique = true)
@AclEntity("applications")
public class Application extends BaseDomain {

    @NotNull
    String name;

    String organizationId;

    List<ApplicationPage> pages;
}
