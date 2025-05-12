package vn.pickleball.courtservice;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class CourtServiceApplication {

	public static void main(String[] args) {
		SpringApplication.run(CourtServiceApplication.class, args);
	}

}
