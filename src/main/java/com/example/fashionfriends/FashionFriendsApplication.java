package com.example.fashionfriends;

import org.h2.server.web.WebServlet;
import com.example.fashionfriends.domain.Clothes;
import com.example.fashionfriends.domain.Member;
import com.example.fashionfriends.repository.ClothesRepository;
import com.example.fashionfriends.repository.MemberRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;

@SpringBootApplication
public class FashionFriendsApplication {

    public static void main(String[] args) {
        SpringApplication.run(FashionFriendsApplication.class, args);
    }

    // 서버 시작 시 자동 실행되는 코드
    @Bean
    public CommandLineRunner demo(MemberRepository memberRepo, ClothesRepository clothesRepo) {
        return (args) -> {
//             1. 테스트 계정 생성 (ID: test, PW: 1234)
//            Member user = new Member("test", "1234", "패피_테스트", "MINIMAL");
//            memberRepo.save(user);
//
//         2. 테스트 옷 데이터 생성
//            clothesRepo.save(new Clothes(user, "아우터", "울 코트", "https://placehold.co/300x300/EFEBE9/8D6E63?text=Coat"));
//            clothesRepo.save(new Clothes(user, "상의", "니트", "https://placehold.co/300x300/D7CCC8/5D4037?text=Knit"));
//
//            System.out.println("✅ 테스트 데이터 생성 완료! (ID: test / PW: 1234)");
        };
    }
}