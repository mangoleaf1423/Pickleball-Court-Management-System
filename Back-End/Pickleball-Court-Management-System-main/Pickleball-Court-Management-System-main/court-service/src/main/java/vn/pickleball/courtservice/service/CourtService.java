package vn.pickleball.courtservice.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.util.UriComponentsBuilder;
import vn.pickleball.courtservice.Utils.SecurityContextUtil;
import vn.pickleball.courtservice.entity.Court;
import vn.pickleball.courtservice.exception.ApiException;
import vn.pickleball.courtservice.mapper.CourtMapper;
import vn.pickleball.courtservice.dto.request.CourtRequest;
import vn.pickleball.courtservice.dto.response.CourtDetail;
import vn.pickleball.courtservice.dto.response.CourtResponse;
import vn.pickleball.courtservice.dto.response.PageResponse;
import vn.pickleball.courtservice.repository.CourtRepository;
import vn.pickleball.courtservice.repository.pagination.PaginationCriteria;

import java.io.IOException;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class CourtService {

    private final CourtRepository courtRepository;

    private final CourtMapper courtMapper;

    private final PaginationCriteria paginationCriteria;

    private final RestTemplate restTemplate;

    private final FirebaseStorageService firebaseStorageService;

    private final RedisTemplate<String, Object> redisTemplate;

    private static final String REDIS_KEY_PREFIX = "booking_slots:";

    // Create
    @PreAuthorize("hasRole('ADMIN')")
    public CourtResponse createCourt(CourtRequest courtRequest) {
        Court court = courtMapper.courtRequestToCourt(courtRequest);
        court.setActive(true);
        return courtMapper.courtToCourtResponse(courtRepository.save(court));
    }


    // Read (Get All court is active)
    public List<CourtResponse> getAllCourtsActive() {
        List<Court> courts = courtRepository.findAllActiveCourts();
        return courts.stream()
                .map(courtMapper::courtToCourtResponse)
                .collect(Collectors.toList());
    }

    public List<CourtResponse> getAllCourts() {
        List<Court> courts = courtRepository.findAll();
        return courts.stream()
                .map(courtMapper::courtToCourtResponse)
                .collect(Collectors.toList());
    }

    @PreAuthorize("hasRole('ADMIN') or hasRole('MANAGER')")
    public List<CourtResponse> getCourtsManage() {
        boolean isAdmin = SecurityContextUtil.isAdmin();
        String managerId = SecurityContextUtil.getUid();
        List<Court> courts = isAdmin ? courtRepository.findAll() : courtRepository.findAllById(getCourtIdsByUserId(managerId));
        return courts.stream()
                .map(courtMapper::courtToCourtResponse)
                .collect(Collectors.toList());
    }


    public CourtResponse getCourtById(String id) {
        Optional<Court> court = courtRepository.findById(id);
        return court.map(courtMapper::courtToCourtResponse).orElse(null);
    }

    @PreAuthorize("@authorizationService.hasAccessToCourt(#id)")
    public CourtDetail getCourtDetail(String id) {
        Optional<Court> court = courtRepository.findById(id);
        return court.map(courtMapper::courtToCourtDetail).orElse(null);
    }


    @PreAuthorize("@authorizationService.hasAccessToCourt(#courtRequest.id)")
    public CourtResponse updateCourt(CourtRequest courtRequest) {
        Court existingCourt = courtRepository.findById(courtRequest.getId())
                .orElseThrow(() -> new RuntimeException("Court not found"));
        courtMapper.updateCourt(existingCourt, courtRequest);
        Court updatedCourt = courtRepository.save(existingCourt);
        deleteBookingSlotsByCourtId(updatedCourt.getId());
        return courtMapper.courtToCourtResponse(updatedCourt);
    }

    @PreAuthorize("hasRole('ADMIN')")
    // Delete
    public void deleteCourt(String id) {
        courtRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Court not found"));
        deleteBookingSlotsByCourtId(id);
        courtRepository.deleteById(id);
    }

    @PreAuthorize("@authorizationService.hasAccessToCourt(#id)")
    public void disableCourt(String id) {
        Optional<Court> court = courtRepository.findById(id);
        if (court.isPresent()) {
            Court existingCourt = court.get();
            existingCourt.setActive(false);
            Court updatedCourt = courtRepository.save(existingCourt);
            deleteBookingSlotsByCourtId(updatedCourt.getId());
        }else {
            throw new RuntimeException("Court not found");
        }
    }

    @PreAuthorize("@authorizationService.hasAccessToCourt(#id)")
    public void activeCourt(String id) {
        Optional<Court> court = courtRepository.findById(id);
        if (court.isPresent()) {
            Court existingCourt = court.get();
            existingCourt.setActive(true);
            Court updatedCourt = courtRepository.save(existingCourt);
            deleteBookingSlotsByCourtId(updatedCourt.getId());
        }else {
            throw new RuntimeException("Court not found");
        }
    }

    public void deleteBookingSlotsByCourtId(String courtId) {
        String pattern = REDIS_KEY_PREFIX + courtId + ":*";

        Set<String> keysToDelete = redisTemplate.keys(pattern);

        if (keysToDelete != null && !keysToDelete.isEmpty()) {
            redisTemplate.delete(keysToDelete);
        }
    }

    public PageResponse<CourtResponse> getAllPageable(int page, int pageSize, String search) {

        int offset = Math.max(0, (page - 1) * pageSize);

        List<Court> courts = paginationCriteria.getCourts(offset, pageSize, search);
        Long totalElements = paginationCriteria.getTotalCourts(search);

        List<CourtResponse> responses = courtMapper.courtsToCourtResponses(courts);

        return PageResponse.<CourtResponse>builder()
                .page(page)
                .size(pageSize)
                .totalElements(totalElements)
                .data(responses)
                .build();
    }

    public List<String> getAllCourtIds() {
        return courtRepository.findAllCourtIds();
    }

    public List<String> getCourtIdsByUserId(String userId) {
        String url = UriComponentsBuilder.fromHttpUrl("http://203.145.46.242:8080/api/identity/public/getCourtIdsByUserId")
                .queryParam("userid", userId)
                .toUriString();

        String[] courtIds = restTemplate.getForObject(url, String[].class);
        return Arrays.asList(courtIds);
    }

    public Court getCourtByCourtId(String courtId){
        return courtRepository.findById(courtId)
                .orElseThrow(() -> new ApiException("Court not found","ENTITY_NOTFOUND"));
    }

    public String uploadLogo(String courtId,MultipartFile file) throws IOException {
        if(!isValidImage(file)) throw new ApiException("File must be image", "INVALID_FILE");
        Court court = courtRepository.findById(courtId).orElseThrow(() -> new RuntimeException("Court not found"));

        if (court.getLogoUrl() != null) {
            firebaseStorageService.deleteFile(court.getLogoUrl());
        }

        String fileUrl = firebaseStorageService.uploadFile(file, "courts/" + courtId);
        court.setLogoUrl(fileUrl);
        courtRepository.save(court);
        return fileUrl;
    }

    public String uploadBackground(String courtId, MultipartFile file) throws IOException {
        if(!isValidImage(file)) throw new ApiException("File must be image", "INVALID_FILE");
        Court court = courtRepository.findById(courtId).orElseThrow(() -> new RuntimeException("Court not found"));

        if (court.getBackgroundUrl() != null) {
            firebaseStorageService.deleteFile(court.getBackgroundUrl());
        }

        String fileUrl = firebaseStorageService.uploadFile(file, "courts/" + courtId);
        court.setBackgroundUrl(fileUrl);
        courtRepository.save(court);
        return fileUrl;
    }

    public boolean isValidImage(MultipartFile file) {
        String contentType = file.getContentType();
        String filename = file.getOriginalFilename();

        if (contentType == null || filename == null) {
            return false;
        }

        String lowerFilename = filename.toLowerCase();
        boolean validExtension = lowerFilename.endsWith(".jpg") || lowerFilename.endsWith(".jpeg")
                || lowerFilename.endsWith(".png") || lowerFilename.endsWith(".gif") || lowerFilename.endsWith(".bmp");

        return contentType.startsWith("image/") && validExtension;
    }
}
