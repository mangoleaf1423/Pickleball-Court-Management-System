package vn.pickleball.courtservice.service;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.pickleball.courtservice.entity.Court;
import vn.pickleball.courtservice.entity.CourtSlot;
import vn.pickleball.courtservice.exception.ApiException;
import vn.pickleball.courtservice.mapper.CourtSlotMapper;
import vn.pickleball.courtservice.dto.request.CourtSlotRequest;
import vn.pickleball.courtservice.dto.response.CourtSlotResponse;
import vn.pickleball.courtservice.repository.CourtSlotRepository;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class CourtSlotService {

    private final CourtSlotRepository courtSlotRepository;

    private final CourtService courtService;

    private final CourtSlotMapper courtSlotMapper;

    @PreAuthorize("@authorizationService.hasAccessToCourt(#courtSlotRequest.courtId)")
    public CourtSlotResponse createCourtSlot(CourtSlotRequest courtSlotRequest) {
        Court court = courtService.getCourtByCourtId(courtSlotRequest.getCourtId());

        CourtSlot exist = courtSlotRepository.findByCourtIdAndName(court.getId(), courtSlotRequest.getName()).orElse(null);

        if(exist != null) throw new ApiException("CourtSlot name existed!", "NAME_EXIST");

        CourtSlot courtSlot = courtSlotMapper.courtSlotRequestToCourtSlot(courtSlotRequest);
        courtSlot.setCourt(court);
        courtSlot.setActive(true);
        courtSlot = courtSlotRepository.save(courtSlot);
        courtService.deleteBookingSlotsByCourtId(court.getId());
        return courtSlotMapper.courtSlotToCourtSlotResponse(courtSlot);
    }

    public CourtSlotResponse getCourtSlotById(String id) {
        CourtSlot courtSlot = courtSlotRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("CourtSlot not found"));
        return courtSlotMapper.courtSlotToCourtSlotResponse(courtSlot);
    }

    public CourtSlot getCourtSlotByCourtSlotId(String id) {
        return courtSlotRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("CourtSlot not found"));
    }

    public List<CourtSlotResponse> getAllCourtSlots() {
        List<CourtSlot> courtSlots = courtSlotRepository.findAll();
        return courtSlots.stream()
                .map(courtSlotMapper::courtSlotToCourtSlotResponse)
                .collect(Collectors.toList());
    }

    @PreAuthorize("@authorizationService.hasAccessToCourtSlot(#courtSlotRequest.id)")
    public CourtSlotResponse updateCourtSlot(CourtSlotRequest courtSlotRequest) {
        CourtSlot courtSlot = courtSlotRepository.findById(courtSlotRequest.getId())
                .orElseThrow(() -> new RuntimeException("CourtSlot not found"));
        CourtSlot exist = courtSlotRepository.findByCourtIdAndName(courtSlot.getCourt().getId(), courtSlotRequest.getName()).orElse(null);

        if(exist != null) throw new ApiException("CourtSlot name existed!", "NAME_EXIST");
        courtSlot.setName(courtSlotRequest.getName());
        courtSlot.setActive(courtSlotRequest.isActive());

        courtSlot = courtSlotRepository.save(courtSlot);
        return courtSlotMapper.courtSlotToCourtSlotResponse(courtSlot);
    }

    @PreAuthorize("@authorizationService.hasAccessToCourtSlot(#id)")
    public void deleteCourtSlot(String id) {
        CourtSlot courtSlot = courtSlotRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("CourtSlot not found"));
        courtService.deleteBookingSlotsByCourtId(courtSlot.getCourt().getId());
        courtSlotRepository.deleteById(id);
    }

    @PreAuthorize("@authorizationService.hasAccessToCourtSlot(#id)")
    public void disableCourtSlot(String id) {
        CourtSlot courtSlot = courtSlotRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("CourtSlot not found"));
        courtService.deleteBookingSlotsByCourtId(courtSlot.getCourt().getId());
        courtSlot.setActive(false);
        courtSlotRepository.save(courtSlot);
    }

    @PreAuthorize("@authorizationService.hasAccessToCourtSlot(#id)")
    public void activeCourtSlot(String id) {
        CourtSlot courtSlot = courtSlotRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("CourtSlot not found"));
        courtService.deleteBookingSlotsByCourtId(courtSlot.getCourt().getId());
        courtSlot.setActive(true);
        courtSlotRepository.save(courtSlot);
    }

    public List<CourtSlotResponse> getCourtSlotsByCourtId(String courtId) {
        List<CourtSlot> courtSlots = courtSlotRepository.findActiveByCourtId(courtId);
        return courtSlots.stream()
                .map(courtSlotMapper::courtSlotToCourtSlotResponse)
                .collect(Collectors.toList());
    }

    public List<CourtSlotResponse> getAllCourtSlotsByCourtId(String courtId) {
        List<CourtSlot> courtSlots = courtSlotRepository.findByCourtId(courtService.getCourtByCourtId(courtId).getId());
        return courtSlots.stream()
                .map(courtSlotMapper::courtSlotToCourtSlotResponse)
                .collect(Collectors.toList());
    }

    public CourtSlotResponse getByName(String courtId, String name){
        CourtSlot exist = courtSlotRepository.findByCourtIdAndName(courtId, name).orElseThrow(() -> new RuntimeException("CourtSlot not found"));
        return courtSlotMapper.courtSlotToCourtSlotResponse(exist);
    }

    public String getCourtIdByCourtSlotId(String courtSlotId){
        CourtSlot courtSlot = courtSlotRepository.findById(courtSlotId).orElseThrow(() -> new RuntimeException("CourtSlot not found"));
        return courtSlot.getCourt().getId();
    }

    public List<CourtSlot> findByCourtIdOrderByCreatedAtAsc(String courtId){
        return courtSlotRepository.findActiveByCourtId(courtId);
    }

}
