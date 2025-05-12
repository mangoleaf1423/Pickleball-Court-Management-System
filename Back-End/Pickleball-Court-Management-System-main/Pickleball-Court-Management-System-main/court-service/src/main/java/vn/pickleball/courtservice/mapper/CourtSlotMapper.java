package vn.pickleball.courtservice.mapper;

import org.mapstruct.*;
import vn.pickleball.courtservice.entity.CourtSlot;
import vn.pickleball.courtservice.dto.request.CourtSlotRequest;
import vn.pickleball.courtservice.dto.response.CourtSlotResponse;

@Mapper(componentModel = "spring", nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE, builder = @Builder(disableBuilder = true), imports = {String.class})
public abstract class CourtSlotMapper {
    @Mapping(target = "court", ignore = true)
    public abstract CourtSlot courtSlotRequestToCourtSlot(CourtSlotRequest courtSlotRequest);

    @Mapping(source = "court.id", target = "courtId")
    public abstract CourtSlotResponse courtSlotToCourtSlotResponse(CourtSlot courtSlot);
}
