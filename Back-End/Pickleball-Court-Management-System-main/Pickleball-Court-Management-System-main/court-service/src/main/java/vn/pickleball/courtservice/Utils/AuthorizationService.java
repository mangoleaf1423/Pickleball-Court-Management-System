package vn.pickleball.courtservice.Utils;

import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import vn.pickleball.courtservice.repository.CourtRepository;
import vn.pickleball.courtservice.repository.CourtSlotRepository;
import vn.pickleball.courtservice.service.CourtService;
import vn.pickleball.courtservice.service.CourtSlotService;

import java.util.List;

@Component
@RequiredArgsConstructor
public class AuthorizationService {
    private final CourtService courtService;
    private final CourtSlotService courtSlotService;

    public boolean hasAccessToCourt(String courtId) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null || authentication.getAuthorities() == null) {
            return false;
        }

        boolean isAdmin = SecurityContextUtil.isAdmin();

        if (isAdmin) {
            return true;
        }

        boolean isManager = authentication.getAuthorities().stream()
                .anyMatch(grantedAuthority -> grantedAuthority.getAuthority().equals("ROLE_MANAGER"));

        List<String> courtIds = courtService.getCourtIdsByUserId(SecurityContextUtil.getUid());

        return courtIds.contains(courtId);
    }

    public boolean hasAccessToCourtSlot(String courtSlotId) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null || authentication.getAuthorities() == null) {
            return false;
        }

        boolean isAdmin = authentication.getAuthorities().stream()
                .anyMatch(grantedAuthority -> grantedAuthority.getAuthority().equals("ROLE_ADMIN"));

        if (isAdmin) {
            return true;
        }

        boolean isManager = authentication.getAuthorities().stream()
                .anyMatch(grantedAuthority -> grantedAuthority.getAuthority().equals("ROLE_MANAGER"));

        List<String> courtIds = courtService.getCourtIdsByUserId(SecurityContextUtil.getUid());

        return courtIds.contains(courtSlotService.getCourtIdByCourtSlotId(courtSlotId));
    }
}
