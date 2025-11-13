package com.appsmith.server.staticurl;

import com.appsmith.external.dtos.UniqueSlugDTO;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.ApplicationMode;
import com.appsmith.server.domains.NewPage;
import com.appsmith.server.dtos.PageDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import reactor.core.publisher.Mono;
import reactor.util.function.Tuple2;

import java.util.List;

@Component
public class StaticUrlServiceCECompatibleImpl implements StaticUrlServiceCECompatible {

    @Override
    public Mono<Application> autoGenerateStaticUrl(String branchedAppId, UniqueSlugDTO uniqueSlugDTO) {
        return Mono.error(new AppsmithException(AppsmithError.UNSUPPORTED_OPERATION));
    }

    @Override
    public Mono<String> suggestUniqueApplicationSlug(String branchedAppId) {
        return Mono.error(new AppsmithException(AppsmithError.UNSUPPORTED_OPERATION));
    }

    @Override
    public Mono<Application> updateApplicationSlug(String branchedAppId, UniqueSlugDTO staticUrlDTO) {
        return Mono.error(new AppsmithException(AppsmithError.UNSUPPORTED_OPERATION));
    }

    @Override
    public Mono<Application> deleteStaticUrlSettings(String branchedAppId) {
        return Mono.error(new AppsmithException(AppsmithError.UNSUPPORTED_OPERATION));
    }

    @Override
    public Mono<UniqueSlugDTO> isApplicationSlugUnique(String branchedAppId, String uniqueSlug) {
        return Mono.error(new AppsmithException(AppsmithError.UNSUPPORTED_OPERATION));
    }

    @Override
    public Mono<NewPage> updatePageSlug(UniqueSlugDTO uniqueSlugDTO) {
        return Mono.error(new AppsmithException(AppsmithError.UNSUPPORTED_OPERATION));
    }

    @Override
    public Mono<UniqueSlugDTO> isPageSlugUnique(String branchedPageId, String uniquePageSlug) {
        return Mono.error(new AppsmithException(AppsmithError.UNSUPPORTED_OPERATION));
    }

    @Override
    public Mono<Tuple2<Application, NewPage>> getApplicationAndPageTupleFromStaticNames(
            String uniqueAppSlug, String uniquePageSlug, String refName, ApplicationMode mode) {
        return Mono.error(new AppsmithException(AppsmithError.UNSUPPORTED_OPERATION));
    }

    @Override
    public Mono<Application> generateAndUpdateApplicationSlugForNewImports(Application application) {
        application.setStaticUrlSettings(null);
        return Mono.just(application);
    }

    @Override
    public Mono<Application> generateAndUpdateApplicationSlugForImportsOnExistingApps(
            Application applicationFromJson, Application applicationFromDB) {
        applicationFromJson.setStaticUrlSettings(null);
        return Mono.just(applicationFromJson);
    }

    @Override
    public Mono<List<NewPage>> updateUniquePageSlugsBeforeImport(
            List<NewPage> pagesToImport, List<NewPage> pagesFromDb, Application importedApplication) {
        return Mono.just(pagesToImport);
    }

    @Override
    public Mono<PageDTO> updateUniqueSlugBeforeClone(PageDTO incomingPageDTO, List<NewPage> existingPagesFromApp) {
        incomingPageDTO.setUniqueSlug(null);
        return Mono.just(incomingPageDTO);
    }

    @Override
    public void deleteUniqueSlugFromDbWhenAbsentFromPageJson(NewPage pageFromJson, NewPage pageFromDb) {
        PageDTO jsonPageEditDTO = pageFromJson.getUnpublishedPage();
        PageDTO dbPageEditDTO = pageFromDb.getUnpublishedPage();

        if (jsonPageEditDTO == null || dbPageEditDTO == null) {
            return;
        }

        if (!StringUtils.hasText(jsonPageEditDTO.getUniqueSlug())) {
            dbPageEditDTO.setUniqueSlug(null);
        }

        return;
    }
}
