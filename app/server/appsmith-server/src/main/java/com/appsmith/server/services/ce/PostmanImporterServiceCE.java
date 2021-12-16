package com.appsmith.server.services.ce;

import com.appsmith.external.models.TemplateCollection;

import java.util.List;

public interface PostmanImporterServiceCE extends ApiImporterCE {

    TemplateCollection importPostmanCollection(Object input);

    List<TemplateCollection> fetchPostmanCollections();

    TemplateCollection deletePostmanCollection(String id);
}
