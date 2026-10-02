package com.bloodbank;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;

@SpringBootApplication
@ConfigurationPropertiesScan
public class BloodBankApplication {
    public static void main(String[] args) {
        SpringApplication.run(BloodBankApplication.class, args);
    }
}