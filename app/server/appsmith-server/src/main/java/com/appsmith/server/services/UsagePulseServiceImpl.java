package com.appsmith.server.services;

import com.appsmith.server.domains.QUsagePulse;
import com.appsmith.server.domains.Tenant;
import com.appsmith.server.domains.UsagePulse;
import com.appsmith.server.dtos.UsagePulseExportDTO;
import com.appsmith.server.dtos.UsagePulseReportDTO;
import com.appsmith.server.helpers.HmacHashUtils;
import com.appsmith.server.repositories.UsagePulseRepository;
import com.appsmith.server.services.ce.UsagePulseServiceCEImpl;
import com.appsmith.server.solutions.UsageReporter;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

import java.security.InvalidKeyException;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class UsagePulseServiceImpl extends UsagePulseServiceCEImpl implements UsagePulseService {
    private final UsagePulseRepository repository;
    private final TenantService tenantService;
    private final UsageReporter usageReporter;
    private final static int MAX_PULSES_TO_SEND = 100;

    public UsagePulseServiceImpl(UsagePulseRepository repository,
                                 SessionUserService sessionUserService,
                                 UserService userService,
                                 TenantService tenantService,
                                 ConfigService configService,
                                 UsageReporter usageReporter) {
        super(repository, sessionUserService, userService, tenantService, configService);
        this.repository = repository;
        this.tenantService = tenantService;
        this.usageReporter = usageReporter;
    }

    /**
     * To send and update usage pulses to Cloud Services for usage and billing
     * On successful send pulses will be deleted from instance
     * @return Mono of Boolean
     */
    public Mono<Boolean> sendAndUpdateUsagePulse() {
        // results will be sorted in ascending order of createdAt
        Sort sort = Sort.by(Sort.Direction.ASC, QUsagePulse.usagePulse.createdAt.getMetadata().getName());
        PageRequest pageRequest = PageRequest.of(0, MAX_PULSES_TO_SEND, sort);
        // Currently only queries pulses from last 7 days to avoid looping effect
        Mono<List<UsagePulse>> usagePulseListMono = repository.findAllByCreatedAtAfter(Instant.now().minus(7, ChronoUnit.DAYS), pageRequest).collectList();
        // TODO: Update this with all tenants once multi-tenancy is introduced
        Mono<Tenant> tenantMono = tenantService.getDefaultTenant();

        return Mono.zip(usagePulseListMono, tenantMono)
                .flatMap(tuple -> {
                    List<UsagePulse> usagePulses = tuple.getT1();
                    if (usagePulses.isEmpty()) {
                        return Mono.just(false).zipWith(Mono.just(usagePulses));
                    }
                    Tenant currentTenant = tuple.getT2();
                    if (tenantService.isValidLicenseConfiguration(currentTenant)) {
                        String licenseKey = currentTenant.getTenantConfiguration().getLicense().getKey();
                        String csInstanceId = currentTenant.getTenantConfiguration().getLicense().getCsInstanceId();
                        UsagePulseReportDTO usagePulseReportDTO = new UsagePulseReportDTO();
                        usagePulseReportDTO.setUsageData(usagePulses.stream().map(usagePulse -> {
                                    UsagePulseExportDTO usagePulseExportDTO = new UsagePulseExportDTO();
                                    usagePulseExportDTO.setInstanceId(usagePulse.getInstanceId());
                                    usagePulseExportDTO.setUser(usagePulse.getUser());
                                    usagePulseExportDTO.setTenantId(usagePulse.getTenantId());
                                    usagePulseExportDTO.setViewMode(usagePulse.getViewMode());
                                    usagePulseExportDTO.setIsAnonymousUser(usagePulse.getIsAnonymousUser());
                                    usagePulseExportDTO.setCreatedAt(usagePulse.getCreatedAt());

                                    return usagePulseExportDTO;
                                }).collect(Collectors.toList()));
                        usagePulseReportDTO.setInstanceId(csInstanceId);
                        String hashedInstanceId;
                        try {
                            hashedInstanceId = HmacHashUtils.hmacWithJava("HmacSHA256", csInstanceId, licenseKey);
                        } catch (NoSuchAlgorithmException | InvalidKeyException e) {
                            return Mono.error(new RuntimeException(e));
                        }
                        usagePulseReportDTO.setHashedInstanceId(hashedInstanceId);

                        return usageReporter.reportUsage(usagePulseReportDTO).zipWith(Mono.just(usagePulses));
                    }
                    return Mono.just(false).zipWith(Mono.just(usagePulses));
                })
                .flatMap(tuple -> {
                    Boolean result = tuple.getT1();
                    List<UsagePulse> usagePulses = tuple.getT2();
                    if (result) {
                        // TODO: Perform soft delete only when pulses are deleted post sending to CS
                        return repository.deleteAll(usagePulses).thenReturn(true);
                    }
                    return Mono.just(false);
                });
    }
}
