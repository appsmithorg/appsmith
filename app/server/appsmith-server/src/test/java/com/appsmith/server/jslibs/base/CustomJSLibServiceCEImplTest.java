package com.appsmith.server.jslibs.base;

import com.appsmith.server.domains.CustomJSLib;
import com.appsmith.server.dtos.CustomJSLibContextDTO;
import com.appsmith.server.dtos.DBOpsType;
import com.appsmith.server.repositories.CustomJSLibRepository;
import com.appsmith.server.testhelpers.ReadBarrierHashMap;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Scheduler;
import reactor.core.scheduler.Schedulers;
import reactor.test.StepVerifier;

import java.time.Duration;
import java.util.List;
import java.util.Set;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.stream.IntStream;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CustomJSLibServiceCEImplTest {

    private static final int LIBRARY_COUNT = 4;

    @Mock
    private CustomJSLibRepository repository;

    @InjectMocks
    private CustomJSLibServiceCEImpl customJSLibService;

    private ExecutorService lookupExecutor;

    @BeforeEach
    void setUp() {
        lookupExecutor = Executors.newFixedThreadPool(LIBRARY_COUNT);
    }

    @AfterEach
    void tearDown() {
        lookupExecutor.shutdownNow();
    }

    @Test
    void should_keepEveryDryRunLibrary_when_librariesArePersistedConcurrently() {
        // Given
        // No library exists yet. Each lookup finishes on its own thread, as the reactive Mongo call does during an
        // import.
        Scheduler lookupThreads = Schedulers.fromExecutorService(lookupExecutor);
        when(repository.findUniqueCustomJsLib(any(CustomJSLib.class)))
                .thenAnswer(invocation -> Mono.<CustomJSLib>empty().subscribeOn(lookupThreads));

        List<CustomJSLib> libraries = IntStream.range(0, LIBRARY_COUNT)
                .mapToObj(index -> newLibrary("library-" + index))
                .toList();

        // The import passes one dry-ops map to every persist call. This map makes every caller read it before any
        // caller writes to it.
        ReadBarrierHashMap<DBOpsType, List<CustomJSLib>> dryOps = new ReadBarrierHashMap<>(LIBRARY_COUNT);

        // When
        Mono<List<CustomJSLibContextDTO>> persistedLibraries = Flux.fromIterable(libraries)
                .flatMap(library -> customJSLibService.persistCustomJSLibMetaDataIfDoesNotExistAndGetDTO(
                        library, false, dryOps, true))
                .collectList();

        // Then
        StepVerifier.create(persistedLibraries)
                .assertNext(persisted -> assertThat(persisted).hasSize(LIBRARY_COUNT))
                .expectComplete()
                .verify(Duration.ofSeconds(30));
        assertThat(dryOps.getWithoutWaiting(DBOpsType.SAVE))
                .extracting(CustomJSLib::getName)
                .containsExactlyInAnyOrder("library-0", "library-1", "library-2", "library-3");
    }

    private static CustomJSLib newLibrary(String name) {
        CustomJSLib library = new CustomJSLib();
        library.setName(name);
        library.setVersion("1.0.0");
        library.setAccessor(Set.of(name));
        library.setUrl("https://example.com/" + name + ".js");
        library.setDefs("{\"!name\":\"LIB/" + name + "\"}");
        return library;
    }
}
