/**
 * 认证中间件测试
 *
 * 测试目标：authMiddleware — JWT 鉴权逻辑
 *
 * 验证三种情况：
 * 1. 没有 Token → 401
 * 2. 无效 Token → 401
 * 3. 有效 Token → 放行，并在 req.user 注入用户信息
 */
import { describe, it, expect, vi, beforeEach } from "vitest"

// ---- mock 配置，让测试不依赖真实 .env ----
vi.mock("../../config", () => ({
  config: {
    port: 3001,
    jwt: {
      secret: "test-secret-key-for-unit-tests",
      expiresIn: "2h",
      refreshExpiresIn: "7d",
    },
    ai: {
      provider: "openai",
      apiKey: "fake-key",
      model: "gpt-4o-mini",
      baseUrl: "",
    },
    upload: {
      dir: "./uploads",
      maxFileSize: 10485760,
    },
    databaseUrl: "",
  },
}))

import jwt from "jsonwebtoken"
import { authMiddleware, AuthRequest } from "../../middlewares/auth"
import type { Response, NextFunction } from "express"

/** 快速构造假的 req/res/next */
function mockReqRes(headers?: Record<string, string>) {
  const req = {
    headers: headers || {},
  } as AuthRequest

  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  } as unknown as Response

  const next = vi.fn() as NextFunction

  return { req, res, next }
}

describe("authMiddleware — JWT 认证中间件", () => {

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("拒绝非法请求", () => {

    it("没有 Authorization 头 → 401", () => {
      const { req, res, next } = mockReqRes()

      authMiddleware(req, res, next)

      expect(res.status).toHaveBeenCalledWith(401)
      expect(next).not.toHaveBeenCalled()
    })

    it("Authorization 头不以 Bearer 开头 → 401", () => {
      const { req, res, next } = mockReqRes({
        authorization: "Basic xyz123",
      })

      authMiddleware(req, res, next)

      expect(res.status).toHaveBeenCalledWith(401)
      expect(next).not.toHaveBeenCalled()
    })

    it("Token 无效（被篡改）→ 401", () => {
      const { req, res, next } = mockReqRes({
        authorization: "Bearer this-is-not-a-valid-jwt",
      })

      authMiddleware(req, res, next)

      expect(res.status).toHaveBeenCalledWith(401)
      expect(next).not.toHaveBeenCalled()
    })

    it("Token 已过期 → 401", () => {
      const expiredToken = jwt.sign(
        { id: "user-1", phone: "13800000000" },
        "test-secret-key-for-unit-tests",
        { expiresIn: "0s" }  // 立即过期
      )

      const { req, res, next } = mockReqRes({
        authorization: `Bearer ${expiredToken}`,
      })

      authMiddleware(req, res, next)

      expect(res.status).toHaveBeenCalledWith(401)
      expect(next).not.toHaveBeenCalled()
    })
  })

  describe("放行合法请求", () => {

    it("有效 Token → 调用 next() 并注入 user", () => {
      const validToken = jwt.sign(
        { id: "user-123", phone: "13800001111" },
        "test-secret-key-for-unit-tests",
        { expiresIn: "1h" }
      )

      const { req, res, next } = mockReqRes({
        authorization: `Bearer ${validToken}`,
      })

      authMiddleware(req, res, next)

      expect(next).toHaveBeenCalled()
      expect(req.user).toBeDefined()
      expect(req.user!.id).toBe("user-123")
      expect(req.user!.phone).toBe("13800001111")
    })
  })
})
