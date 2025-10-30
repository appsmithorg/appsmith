package com.appsmith.server.staticurl;

import com.appsmith.external.dtos.UniqueSlugDTO;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.ApplicationMode;
import com.appsmith.server.domains.NewPage;
import reactor.core.publisher.Mono;
import reactor.util.function.Tuple2;

import java.util.List;

public interface StaticUrlServiceCECompatible {

    // ------------------------- Application Section ---------------------

    Mono<String> suggestUniqueApplicationSlug(String branchedAppId);

    Mono<Application> autoGenerateStaticUrl(String branchedAppId, UniqueSlugDTO uniqueSlugDTO);

    Mono<Application> updateApplicationSlug(String branchedAppId, UniqueSlugDTO staticUrlDTO);

    Mono<Application> deleteStaticUrlSettings(String branchedAppId);

    Mono<UniqueSlugDTO> isApplicationSlugUnique(String branchedAppId, String uniqueSlug);

    // ------------------------- Pages Section ---------------------

    Mono<NewPage> updatePageSlug(UniqueSlugDTO uniqueSlugDTO);

    Mono<UniqueSlugDTO> isPageSlugUnique(String branchedPageId, String uniquePageSlug);

    // ------------------------- Routing Section ---------------------
    Mono<Tuple2<Application, NewPage>> getApplicationAndPageTupleFromStaticNames(
            String uniqueAppSlug, String uniquePageSlug, String refName, ApplicationMode mode);

    // ------------------------- Import Section ---------------------

    Mono<Application> generateAndUpdateApplicationSlugForNewImports(Application application);

    Mono<Application> generateAndUpdateApplicationSlugForImportsOnExistingApps(
            Application applicationFromJson, Application applicationFromDB);

    Mono<List<NewPage>> updateUniquePageSlugsBeforeImport(
            List<NewPage> pagesToImport, List<NewPage> pagesFromDb, Application importedApplication);

    void deleteUniqueSlugFromDbWhenAbsentFromPageJson(NewPage pageFromJson, NewPage pageFromDb);
}
