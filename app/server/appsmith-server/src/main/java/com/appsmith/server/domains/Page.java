package com.appsmith.server.domains;

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
@Document
@CompoundIndex(def = "{'applicationId':1, 'name':1}", name = "application_page_compound_index", unique = true)
public class Page extends BaseDomain {
    String name;

    @NotNull
    String applicationId;

    List<Layout> layouts;

    List<PageAction> actions;
}
