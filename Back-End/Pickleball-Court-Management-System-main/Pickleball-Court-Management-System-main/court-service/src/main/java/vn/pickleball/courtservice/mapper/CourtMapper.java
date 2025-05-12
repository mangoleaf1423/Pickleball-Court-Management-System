package vn.pickleball.courtservice.mapper;

import org.mapstruct.*;
import vn.pickleball.courtservice.entity.Court;
import vn.pickleball.courtservice.dto.request.CourtRequest;
import vn.pickleball.courtservice.dto.response.CourtDetail;
import vn.pickleball.courtservice.dto.response.CourtResponse;

import java.util.List;

@Mapper(componentModel = "spring", nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE, builder = @Builder(disableBuilder = true), imports = {String.class})
public abstract class CourtMapper {
    @Mapping(target = "logoUrl",ignore = true)
    @Mapping(target = "backgroundUrl",ignore = true)
    public abstract Court courtRequestToCourt(CourtRequest courtRequest);

    @Mapping(target = "logoUrl",ignore = true)
    @Mapping(target = "backgroundUrl",ignore = true)
    public abstract void updateCourt(@MappingTarget Court court , CourtRequest request);

    public abstract CourtResponse courtToCourtResponse(Court court);

    public abstract CourtDetail courtToCourtDetail(Court court);

    public abstract List<CourtResponse> courtsToCourtResponses(List<Court> courts);
}
