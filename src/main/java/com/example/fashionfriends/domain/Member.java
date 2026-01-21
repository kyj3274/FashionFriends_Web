package com.example.fashionfriends.domain;
import jakarta.persistence.*;

@Entity
public class Member {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String userId;      // 로그인용 아이디 (예: younjae)
    private String password;    // 비밀번호
    private String nickname;    // 닉네임 (예: 패피_윤재)
    private String profileImg;  // 프로필 사진 URL
    private int matesCount; // 팔로워
    private int refsCount;  // 팔로잉
    // 사용자의 추구미 (예: "MINIMAL,CASUAL")
    // 간단하게 문자열로 저장하고 콤마(,)로 구분해서 쓸 예정입니다.
    private String styleTags;

    // 생성자
    public Member() {}

    public Member(String userId, String password, String nickname, String styleTags) {
        this.userId = userId;
        this.password = password;
        this.nickname = nickname;
        this.styleTags = styleTags;
        this.profileImg = "https://placehold.co/100x100/A1887F/fff?text=ME"; // 기본 프사
    }

    // Getter & Setter
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }

    public String getNickname() { return nickname; }
    public void setNickname(String nickname) { this.nickname = nickname; }

    public String getProfileImg() { return profileImg; }
    public void setProfileImg(String profileImg) { this.profileImg = profileImg; }

    public String getStyleTags() { return styleTags; }
    public void setStyleTags(String styleTags) { this.styleTags = styleTags; }


}