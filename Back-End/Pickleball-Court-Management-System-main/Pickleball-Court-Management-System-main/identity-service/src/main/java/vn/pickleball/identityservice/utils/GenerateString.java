package vn.pickleball.identityservice.utils;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.util.Base64;

public class GenerateString {
    private static final String CHAR_LOWER = "abcdefghijklmnopqrstuvwxyz";
    private static final String CHAR_UPPER = CHAR_LOWER.toUpperCase();
    private static final String NUMBER = "0123456789";
    private static final String DATA_FOR_RANDOM_STRING = CHAR_LOWER + CHAR_UPPER + NUMBER;
    private static final String HMAC_SHA256 = "HmacSHA256";
    private static final String SALT = "dHRzX2phdmFfMDFAaHlwZXJsb2d5LmNvbTpIeXBlckAxMjN0dHNfamF2YV8wMUBoeXBlcmxvZ3kuY29t";

    private static final char[] digits = {
            '0', '1', '2', '3', '4', '5', '6', '7', '8', '9',
            'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J',
            'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T',
            'U', 'V', 'W', 'X', 'Y', 'Z', 'a', 'b', 'c', 'd',
            'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n',
            'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x',
            'y', 'z'
    };

    private static SecureRandom random = new SecureRandom();

    public static String generateRandomString(int length) {
        if (length < 1) throw new IllegalArgumentException();

        StringBuilder sb = new StringBuilder(length);
        for (int i = 0; i < length; i++) {

            // 0-62 (exclusive), random returns 0-61
            int rndCharAt = random.nextInt(DATA_FOR_RANDOM_STRING.length());
            char rndChar = DATA_FOR_RANDOM_STRING.charAt(rndCharAt);

            sb.append(rndChar);

        }

        return sb.toString();

    }

    public static String generateRandomPass(int length) {
        if (length < 2) throw new IllegalArgumentException("Length must be at least 2");

        StringBuilder sb = new StringBuilder(length);

        // Bắt buộc thêm 1 chữ cái và 1 chữ số
        sb.append(CHAR_UPPER.charAt(random.nextInt(CHAR_UPPER.length())));
        sb.append(NUMBER.charAt(random.nextInt(NUMBER.length())));

        // Thêm các ký tự còn lại
        for (int i = 2; i < length; i++) {
            sb.append(DATA_FOR_RANDOM_STRING.charAt(random.nextInt(DATA_FOR_RANDOM_STRING.length())));
        }

        return sb.toString();
    }


    public static String encode(String totalAmount, String paymentAmount, String depositAmount, String bookingDate) {
        try {
            String data = totalAmount + "|" + paymentAmount + "|" + depositAmount + "|" +  bookingDate;
            Mac mac = Mac.getInstance(HMAC_SHA256);
            SecretKeySpec secretKey = new SecretKeySpec(SALT.getBytes(StandardCharsets.UTF_8), HMAC_SHA256);
            mac.init(secretKey);
            byte[] hash = mac.doFinal(data.getBytes(StandardCharsets.UTF_8));
            return Base64.getEncoder().encodeToString(hash);
        } catch (Exception e) {
            throw new RuntimeException("Error while generating signature", e);
        }
    }

    // Hàm kiểm tra signature có hợp lệ không
    public static boolean isValidSignature(String totalAmount, String paymentAmount, String depositAmount, String phoneNumber, String providedSignature) {
        String expectedSignature = encode(totalAmount,paymentAmount,depositAmount, phoneNumber);
        return expectedSignature.equals(providedSignature);
    }

}
