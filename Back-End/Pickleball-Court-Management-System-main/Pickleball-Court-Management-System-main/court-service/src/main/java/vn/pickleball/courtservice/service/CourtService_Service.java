package vn.pickleball.courtservice.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import vn.pickleball.courtservice.entity.Court;
import vn.pickleball.courtservice.entity.CourtServiceEntity;
import vn.pickleball.courtservice.exception.ApiException;
import vn.pickleball.courtservice.mapper.CourtServiceMapper;
import vn.pickleball.courtservice.dto.request.CourtServicePurchaseRequest;
import vn.pickleball.courtservice.dto.request.CourtServiceRequest;
import vn.pickleball.courtservice.dto.response.CourtServiceResponse;
import vn.pickleball.courtservice.repository.CourtServiceRepository;

import java.io.IOException;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CourtService_Service {
    private final CourtService courtService;
    private final CourtServiceRepository courtServiceRepository;
    private final CourtServiceMapper courtServiceMapper;
    private final FirebaseStorageService firebaseStorageService;

    public CourtServiceResponse createCourtService(CourtServiceRequest request) {
        Court court = courtService.getCourtByCourtId(request.getCourtId());

        CourtServiceEntity courtService = courtServiceMapper.toEntity(request);
        courtService.setCourt(court);
        courtService.setActive(request.isActive());
        courtService.setSoldCount(0);

        return courtServiceMapper.toResponse(courtServiceRepository.save(courtService));
    }

    public CourtServiceResponse updateCourtService(CourtServiceRequest request) {
        CourtServiceEntity courtService = courtServiceRepository.findById(request.getId())
                .orElseThrow(() -> new RuntimeException("CourtService not found"));

        courtServiceMapper.updateEntityFromRequest(request, courtService);
        return courtServiceMapper.toResponse(courtServiceRepository.save(courtService));
    }

    public void activateCourtService(String id, boolean active) {
        CourtServiceEntity courtService = courtServiceRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("CourtService not found"));
        courtService.setActive(active);
        courtServiceRepository.save(courtService);
    }

    public List<CourtServiceResponse> getCourtServicesByCourtId(String courtId) {
        return courtServiceRepository.findActiveByCourtId(courtService.getCourtByCourtId(courtId).getId())
                .stream()
                .map(courtServiceMapper::toResponse)
                .collect(Collectors.toList());
    }

    public List<CourtServiceResponse> getAllCourtServicesByCourtId(String courtId) {
        return courtServiceRepository.findByCourtId(courtId)
                .stream()
                .map(courtServiceMapper::toResponse)
                .collect(Collectors.toList());
    }

    public void updateAfterPurchase(List<CourtServicePurchaseRequest> requests) {
        requests.forEach(req -> {
            CourtServiceEntity courtService = courtServiceRepository.findById(req.getId())
                    .orElseThrow(() -> new RuntimeException("CourtService not found with id: " + req.getId()));

            if (req.getQuantity() > courtService.getQuantity()) {
                throw new RuntimeException("Not enough stock for service id: " + req.getId());
            }

            // Trừ quantity
            courtService.setQuantity(courtService.getQuantity() - req.getQuantity());
            // Cộng soldCount
            courtService.setSoldCount(courtService.getSoldCount() + req.getQuantity());

            courtServiceRepository.save(courtService);
        });
    }

    public void uploadImage (String id, MultipartFile file){
        CourtServiceEntity courtService = courtServiceRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("CourtService not found"));
        if (courtService.getImageUrl() != null) {
            firebaseStorageService.deleteFile(courtService.getImageUrl());
        }

        try {
            String fileUrl = firebaseStorageService.uploadFile(file, "courts/" + courtService.getCourt().getId() + "/services");
            courtService.setImageUrl(fileUrl);
            courtServiceRepository.save(courtService);
        } catch (IOException e) {
            throw new ApiException("Upload service image fail","UPLOAD_FAIL");
        }
    }

}
