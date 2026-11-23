package com.appsmith.server.diagnostics.collectors;

import com.appsmith.server.diagnostics.DiagnosticsValues;
import lombok.extern.slf4j.Slf4j;
import reactor.core.publisher.Mono;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.function.Supplier;

/**
 * Merges the EE-only fields of a diagnostics section into its CE data.
 */
@Slf4j
final class DiagnosticsEeFields {

    private DiagnosticsEeFields() {}

    /**
     * Runs the EE stage together with the CE stage, so both share the section time limit. An EE error, a timeout or an
     * empty EE result reports {@code UNKNOWN} for every key in {@code eeKeys} and keeps the section. A CE error or an
     * empty CE result propagates.
     *
     * @param ceData       the CE values
     * @param eeFields     the EE values, called once when the merge is subscribed
     * @param eeKeys       the keys the EE stage reports
     * @param sectionLabel a fixed label for the debug log
     * @return a new map with the CE entries first, then the EE entries
     */
    static Mono<Map<String, Object>> merge(
            Mono<Map<String, Object>> ceData,
            Supplier<Mono<Map<String, Object>>> eeFields,
            List<String> eeKeys,
            String sectionLabel) {
        Mono<Map<String, Object>> ee = Mono.defer(eeFields)
                .timeout(DiagnosticsValues.EE_FIELDS_TIMEOUT)
                .onErrorResume(error -> {
                    log.debug(
                            "Support diagnostics {} EE fields failed with {}",
                            sectionLabel,
                            error.getClass().getName());
                    return Mono.just(DiagnosticsValues.allWith(eeKeys, DiagnosticsValues.UNKNOWN));
                })
                .switchIfEmpty(Mono.fromSupplier(() -> DiagnosticsValues.allWith(eeKeys, DiagnosticsValues.UNKNOWN)));

        return Mono.zip(ceData, ee).map(parts -> {
            Map<String, Object> merged = new LinkedHashMap<>(parts.getT1());
            merged.putAll(parts.getT2());
            return merged;
        });
    }
}
