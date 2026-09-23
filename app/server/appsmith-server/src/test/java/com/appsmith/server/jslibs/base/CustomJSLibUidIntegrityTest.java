package com.appsmith.server.jslibs.base;

import com.appsmith.server.constants.ApplicationConstants;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.CustomJSLib;
import com.appsmith.server.dtos.CustomJSLibContextDTO;
import com.appsmith.server.jslibs.context.ContextBasedJsLibService;
import com.appsmith.server.repositories.CustomJSLibRepository;
import com.appsmith.server.services.AnalyticsService;
import jakarta.validation.Validator;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

/**
 * Verifies that the identity key of a shared, instance-global custom JS library record is derived
 * on the server from its accessor + URL, and that a client-supplied value for that key is ignored
 * when the record is persisted.
 *
 * <p>Without server-side derivation at the persist boundary, a caller could point the shared record
 * lookup at an arbitrary existing record (one it does not own) and overwrite the script URL that
 * other applications load. This test exercises that boundary directly, with no database.
 */
class CustomJSLibUidIntegrityTest {

    private CustomJSLibRepository repository;
    private CustomJSLibServiceCEImpl customJSLibService;

    @BeforeEach
    @SuppressWarnings("unchecked")
    void setUp() {
        Validator validator = mock(Validator.class);
        repository = mock(CustomJSLibRepository.class);
        AnalyticsService analyticsService = mock(AnalyticsService.class);
        ContextBasedJsLibService<Application> applicationContextBasedJsLibService =
                mock(ContextBasedJsLibService.class);
        com.appsmith.server.applications.base.ApplicationService applicationService =
                mock(com.appsmith.server.applications.base.ApplicationService.class);
        com.appsmith.server.solutions.ApplicationPermission applicationPermission =
                mock(com.appsmith.server.solutions.ApplicationPermission.class);

        customJSLibService = new CustomJSLibServiceCEImpl(
                validator,
                repository,
                analyticsService,
                applicationContextBasedJsLibService,
                applicationService,
                applicationPermission);
    }

    /**
     * A library whose accessor + URL derive one uid, but whose uid field has been overwritten with a
     * different (victim) value by the caller, must be looked up and stored under the server-derived
     * uid — never the caller-supplied one.
     */
    @Test
    void persistUsesServerDerivedUidAndIgnoresClientSuppliedUid() {
        String legitimateUrl = "https://attacker.example/only-my-own-app.js";
        CustomJSLib jsLib = new CustomJSLib();
        jsLib.setName("myOwnLib");
        jsLib.setVersion("1.0.0");
        jsLib.setAccessor(Set.of("myOwnLib"));
        jsLib.setUrl(legitimateUrl);
        jsLib.setDefs("{\"!name\":\"LIB/myOwnLib\"}");

        // The server-derived uid for this accessor + url.
        String serverDerivedUid = String.join("_", "myOwnLib", legitimateUrl);

        // The caller forges the uid to collide with a shared record it does not own.
        String forgedVictimUid = ApplicationConstants.XML_PARSER_LIBRARY_UID;
        jsLib.setUidString(forgedVictimUid);

        // No existing record -> the switchIfEmpty save branch runs.
        ArgumentCaptor<CustomJSLib> lookupCaptor = ArgumentCaptor.forClass(CustomJSLib.class);
        when(repository.findUniqueCustomJsLib(lookupCaptor.capture())).thenReturn(Mono.empty());
        when(repository.save(any(CustomJSLib.class))).thenAnswer(invocation -> Mono.just(invocation.getArgument(0)));

        StepVerifier.create(customJSLibService.persistCustomJSLibMetaDataIfDoesNotExistAndGetDTO(jsLib, false))
                .assertNext((CustomJSLibContextDTO dto) -> {
                    // The persisted/returned record must carry the server-derived uid, not the forged one.
                    assertThat(dto.getUidString()).isEqualTo(serverDerivedUid);
                    assertThat(dto.getUidString()).isNotEqualTo(forgedVictimUid);
                })
                .verifyComplete();

        // The lookup that decides which shared record gets overwritten must key on the server-derived
        // uid, so a forged value cannot target another owner's record.
        assertThat(lookupCaptor.getValue().getUidString()).isEqualTo(serverDerivedUid);
        assertThat(lookupCaptor.getValue().getUidString()).isNotEqualTo(forgedVictimUid);
    }

    /**
     * Domain-level guarantee: recomputing the uid from the current accessor + url replaces any value
     * the caller may have injected into the uid field.
     */
    @Test
    void recomputeUidStringReplacesClientSuppliedValue() {
        CustomJSLib jsLib = new CustomJSLib();
        jsLib.setAccessor(Set.of("libA"));
        jsLib.setUrl("https://example.com/a.js");
        String expected = String.join("_", "libA", "https://example.com/a.js");

        jsLib.setUidString("forged-value-that-should-not-survive");
        jsLib.recomputeUidString();

        assertThat(jsLib.getUidString()).isEqualTo(expected);
    }
}
