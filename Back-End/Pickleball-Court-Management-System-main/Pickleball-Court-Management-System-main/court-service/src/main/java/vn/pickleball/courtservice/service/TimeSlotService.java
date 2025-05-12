package vn.pickleball.courtservice.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.pickleball.courtservice.entity.TimeSlot;
import vn.pickleball.courtservice.repository.TimeSlotRepository;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class TimeSlotService {
    private final TimeSlotRepository timeSlotRepository;

    public List<TimeSlot> findByCourtIdOrderByStartTimeAsc(String courtId){
        return timeSlotRepository.findByCourtIdOrderByStartTimeAsc(courtId);
    }

    public List<TimeSlot> saveAll(List<TimeSlot> timeSlots){
       return timeSlotRepository.saveAll(timeSlots);
    }

    public void deleteAllTimeSlots(List<TimeSlot> timeSlots) {
        if (timeSlots != null && !timeSlots.isEmpty()) {
            timeSlotRepository.deleteAll(timeSlots);
        }
    }


}
