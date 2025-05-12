package vn.pickleball.courtservice.job;


import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import vn.pickleball.courtservice.service.CourtMaintenanceHistoryService;

@Component
@EnableScheduling
@Slf4j
@RequiredArgsConstructor
public class MaintenanceScheduler {

    private final CourtMaintenanceHistoryService courtMaintenanceHistoryService;


    @Scheduled(cron = "0 0 6 * * ?")
    public void runMaintenanceCheck() {
        log.info("Execute job maintenance notification");
        courtMaintenanceHistoryService.checkAndNotifyMaintenance();
    }
}
