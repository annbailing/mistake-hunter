import { describe, it, expect } from "vitest";
import { api, uniquePhone, registerAndGetToken } from "./helpers";

describe("认证模块 /api/auth", () => {
  describe("POST /register", () => {
    it("应成功注册新用户", async () => {
      const res = await api
        .post("/api/auth/register")
        .send({
          phone: uniquePhone(),
          password: "test123456",
          nickname: "张三",
          grade_level: "junior",
        })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toBeTruthy();
      expect(res.body.data.refreshToken).toBeTruthy();
      expect(res.body.data.user.nickname).toBe("张三");
      expect(res.body.data.user.gradeLevel).toBe("junior");
    });

    it("手机号重复应返回 409", async () => {
      const phone = uniquePhone();
      await api.post("/api/auth/register").send({
        phone,
        password: "test123456",
        nickname: "首次",
        grade_level: "senior",
      });

      const res = await api
        .post("/api/auth/register")
        .send({
          phone,
          password: "test123456",
          nickname: "重名",
          grade_level: "junior",
        })
        .expect(409);

      expect(res.body.success).toBe(false);
    });

    it("缺少必填字段应返回错误", async () => {
      const res = await api
        .post("/api/auth/register")
        .send({ phone: uniquePhone() });
      // express-validator 返回 400
      expect(res.status).toBeGreaterThanOrEqual(400);
      expect(res.status).toBeLessThan(500);
      expect(res.body.success).toBeFalsy();
    });
  });

  describe("POST /login", () => {
    it("正确密码应登录成功", async () => {
      const phone = uniquePhone();
      await api.post("/api/auth/register").send({
        phone,
        password: "test123456",
        nickname: "登录测试",
        grade_level: "senior",
      });

      const res = await api
        .post("/api/auth/login")
        .send({ phone, password: "test123456" })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toBeTruthy();
    });

    it("错误密码应返回 401", async () => {
      const phone = uniquePhone();
      await api.post("/api/auth/register").send({
        phone,
        password: "test123456",
        nickname: "密码测试",
        grade_level: "senior",
      });

      const res = await api
        .post("/api/auth/login")
        .send({ phone, password: "wrongpassword" })
        .expect(401);

      expect(res.body.success).toBe(false);
    });
  });

  describe("GET /me", () => {
    it("有效 token 应返回用户信息", async () => {
      const { token } = await registerAndGetToken();

      const res = await api
        .get("/api/auth/me")
        .set("Authorization", `Bearer ${token}`)
        .expect(200);

      expect(res.body.data.nickname).toBe("测试选手");
    });

    it("无 token 应返回 401", async () => {
      const res = await api.get("/api/auth/me").expect(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe("PUT /profile", () => {
    it("应成功更新昵称", async () => {
      const { token } = await registerAndGetToken();

      const res = await api
        .put("/api/auth/profile")
        .set("Authorization", `Bearer ${token}`)
        .send({ nickname: "新昵称" })
        .expect(200);

      expect(res.body.data.nickname).toBe("新昵称");
    });
  });
});
