/**
 * API 端到端测试
 *
 * 测试目标：真实 HTTP 请求 → Express 应用
 *
 * 这里测试的是"整个链条"：
 *   请求 → 路由 → 中间件 → 控制器 → 服务层 → 数据库 → 响应
 *
 * 运行前需要确保：
 *   1. 数据库已迁移（npx prisma migrate dev）
 *   2. 没有其他进程占用 3001 端口
 */
import { describe, it, expect, beforeAll, afterAll } from "vitest"
import request from "supertest"
import app from "../../app"

describe("API 端到端测试", () => {

  // =========================================================
  //  健康检查（不需要认证）
  // =========================================================
  describe("GET /api/health", () => {

    it("返回 200 和 { success: true }", async () => {
      const res = await request(app).get("/api/health")

      expect(res.status).toBe(200)
      expect(res.body).toHaveProperty("success", true)
      expect(res.body.data).toHaveProperty("status", "ok")
    })
  })

  // =========================================================
  //  认证接口（不需要 Token）
  // =========================================================
  describe("POST /api/auth/register — 注册", () => {

    it("缺少必填字段 → 400", async () => {
      const res = await request(app)
        .post("/api/auth/register")
        .send({}) // 空数据

      expect(res.status).toBe(400)
    })

    it("手机号格式不对 → 400", async () => {
      const res = await request(app)
        .post("/api/auth/register")
        .send({
          phone: "123",
          password: "123456",
          nickname: "测试",
          grade_level: "junior",
        })

      expect(res.status).toBe(400)
    })
  })

  describe("POST /api/auth/login — 登录", () => {

    it("不存在的手机号 → 401", async () => {
      const res = await request(app)
        .post("/api/auth/login")
        .send({
          phone: "19999999999",
          password: "123456",
        })

      expect(res.status).toBe(401)
    })
  })

  // =========================================================
  //  需要认证的接口
  // =========================================================
  describe("需要 Token 的接口", () => {

    it("GET /api/mistakes — 没 Token → 401", async () => {
      const res = await request(app).get("/api/mistakes")

      expect(res.status).toBe(401)
    })

    it("GET /api/subjects — 没 Token → 401", async () => {
      const res = await request(app).get("/api/subjects")

      expect(res.status).toBe(401)
    })

    it("GET /api/review/today — 没 Token → 401", async () => {
      const res = await request(app).get("/api/review/today")

      expect(res.status).toBe(401)
    })
  })
})
