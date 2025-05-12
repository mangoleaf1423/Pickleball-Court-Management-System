package vn.pickleball.identityservice.service;


import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.pickleball.identityservice.entity.CourtStaff;
import vn.pickleball.identityservice.repository.CourtStaffRepository;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class CourtStaffService {
    private final CourtStaffRepository courtStaffRepository;

    public List<String> getUsersByCourtId(String courtId) {
        return courtStaffRepository.findByCourtId(courtId).stream()
                .map(CourtStaff::getUserId)
                .collect(Collectors.toList());
    }


    @Transactional(readOnly = true)
    public List<String> getCourtsByUserId(String userId) {
        return courtStaffRepository.findByUserId(userId).stream()
                .map(CourtStaff::getCourtId)
                .collect(Collectors.toList());
    }

    public void deleteByUserId(String uid){
        courtStaffRepository.deleteByUserId(uid);
    }

    public void deleteByUserIdAndCourtIdsNotIn (String uid , List<String> courtIds){
        courtStaffRepository.deleteByUserIdAndCourtIdsNotIn(uid, courtIds);
    }
}
