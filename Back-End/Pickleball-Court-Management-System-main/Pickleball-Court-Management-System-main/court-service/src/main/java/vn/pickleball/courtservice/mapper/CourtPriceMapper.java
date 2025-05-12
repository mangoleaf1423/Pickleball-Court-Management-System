package vn.pickleball.courtservice.mapper;

import org.mapstruct.Builder;
import org.mapstruct.Mapper;
import org.mapstruct.NullValuePropertyMappingStrategy;
import vn.pickleball.courtservice.entity.CourtPrice;
import vn.pickleball.courtservice.dto.response.CourtPriceResponse;

@Mapper(componentModel = "spring", nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE, builder = @Builder(disableBuilder = true), imports = {String.class})
public abstract class CourtPriceMapper {
    public abstract CourtPriceResponse toCourtPriceResponse(CourtPrice courtPrice);
}
