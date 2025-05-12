package vn.pickleball.identityservice.dto;

import com.fasterxml.jackson.annotation.JsonFormat;

@JsonFormat(shape = JsonFormat.Shape.STRING)
public enum UserRank {
    BRONZE,
    SILVER,
    GOLD,
    DIAMOND
}
