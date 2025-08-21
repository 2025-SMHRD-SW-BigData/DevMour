import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const Login = () => {
    const [userId, setUserId] = useState("");
    const [password, setPassword] = useState("");
    const nav = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.post("http://localhost:3001/api/login", {
                user_id: userId,
                password: password
            });
            console.log("로그인 성공:", response.data);
            // 로그인 성공하면 대시보드 이동
            nav("/dashboard");
        } catch (error) {
            console.error("로그인 실패:", error.response?.data || error.message);
            alert(error.response?.data.message || "로그인 실패");
        }
    };

    return (
        <div style={{ display: "flex", justifyContent: "center", marginTop: "100px" }}>
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", width: "300px" }}>
                <h2>로그인</h2>
                <input 
                    type="text" 
                    placeholder="아이디" 
                    value={userId} 
                    onChange={(e) => setUserId(e.target.value)} 
                    required
                    style={{ marginBottom: "10px", padding: "8px" }}
                />
                <input 
                    type="password" 
                    placeholder="비밀번호" 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)} 
                    required
                    style={{ marginBottom: "10px", padding: "8px" }}
                />
                <button type="submit" style={{ padding: "10px", backgroundColor: "#4CAF50", color: "white", border: "none" }}>
                    로그인
                </button>
            </form>
        </div>
    );
};

export default Login;