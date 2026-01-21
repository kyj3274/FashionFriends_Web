package com.example.fashionfriends.controller;

import com.example.fashionfriends.domain.Member;
import com.example.fashionfriends.service.MemberService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private MemberService memberService;

    // 회원가입
    @PostMapping("/join")
    public Member join(@RequestBody Map<String, String> payload) {
        Member member = new Member();
        member.setUserId(payload.get("userId"));
        member.setPassword(payload.get("password"));
        member.setNickname(payload.get("nickname"));
        // 스타일 태그 저장 (MINIMAL,CASUAL 형태의 문자열)
        member.setStyleTags(payload.get("styleTags"));
        // 기본 프사 설정
        member.setProfileImg("https://placehold.co/100x100/A1887F/fff?text=" + payload.get("nickname").substring(0,1));

        return memberService.join(member);
    }

    // 로그인
    @PostMapping("/login")
    public Member login(@RequestBody Map<String, String> loginData) {
        String userId = loginData.get("userId");
        String password = loginData.get("password");
        return memberService.login(userId, password);
    }

    // 프로필 수정 기능 (닉네임 변경)
    @PostMapping("/update")
    public Member updateProfile(@RequestBody Map<String, String> payload) {
        String userId = payload.get("userId");     // 누가 요청했는지 알아야 함
        String nickname = payload.get("nickname"); // 바꿀 닉네임

        return memberService.updateMember(userId, nickname);
    }
}