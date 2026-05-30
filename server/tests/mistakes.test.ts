import { describe, it, expect } from "vitest";
import { api, registerAndGetToken } from "./helpers";

describe("错题模块 /api/mistakes", () => {
  let token: string;
  let subjectId: string;

  // 每个测试前准备：注册 → 获取科目列表
  beforeAll(async () => {
    const auth = await registerAndGetToken();
    token = auth.token;

    const subRes = await api
      .get("/api/subjects")
      .set("Authorization", `Bearer ${token}`);
    subjectId = subRes.body.data?.[0]?.id;
  });

  describe("POST /", () => {
    it("应成功创建错题", async () => {
      const res = await api
        .post("/api/mistakes")
        .set("Authorization", `Bearer ${token}`)
        .send({
          subjectId,
          title: "测试错题：三角函数求值",
          content: "已知 sinα = 3/5，求 cosα",
          myAnswer: "4/5",
          correctAnswer: "±4/5（需判断象限）",
          errorType: "concept",
        })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toBe("测试错题：三角函数求值");
      expect(res.body.data.subjectId).toBe(subjectId);
    });

    it("缺少必填字段应返回错误", async () => {
      const res = await api
        .post("/api/mistakes")
        .set("Authorization", `Bearer ${token}`)
        .send({ title: "无科目" });
      // 422 validation error
      expect(res.body.success).toBeFalsy();
    });
  });

  describe("GET /", () => {
    it("应返回分页列表", async () => {
      // 先创建一条
      await api
        .post("/api/mistakes")
        .set("Authorization", `Bearer ${token}`)
        .send({
          subjectId,
          title: "列表测试",
          content: "题目内容",
          errorType: "compute",
        });

      const res = await api
        .get("/api/mistakes")
        .set("Authorization", `Bearer ${token}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.list)).toBe(true);
      expect(res.body.data.pagination).toBeTruthy();
      expect(res.body.data.pagination.total).toBeGreaterThan(0);
    });

    it("应支持 keyword 搜索", async () => {
      const res = await api
        .get("/api/mistakes?keyword=三角函数")
        .set("Authorization", `Bearer ${token}`)
        .expect(200);

      expect(res.body.data.list.length).toBeGreaterThanOrEqual(0);
    });

    it("应支持科目筛选", async () => {
      const res = await api
        .get(`/api/mistakes?subjectId=${subjectId}`)
        .set("Authorization", `Bearer ${token}`)
        .expect(200);

      res.body.data.list.forEach((m: any) => {
        expect(m.subjectId).toBe(subjectId);
      });
    });
  });

  describe("GET /:id & PUT /:id & DELETE /:id", () => {
    let mistakeId: string;

    beforeAll(async () => {
      const res = await api
        .post("/api/mistakes")
        .set("Authorization", `Bearer ${token}`)
        .send({
          subjectId,
          title: "CRUD 目标",
          content: "测试 CRUD 完整链路",
        });
      mistakeId = res.body.data.id;
    });

    it("GET /:id — 返回详情", async () => {
      const res = await api
        .get(`/api/mistakes/${mistakeId}`)
        .set("Authorization", `Bearer ${token}`)
        .expect(200);

      expect(res.body.data.id).toBe(mistakeId);
      expect(res.body.data.subject).toBeTruthy();
    });

    it("GET /:id — 不存在的 ID 返回 404", async () => {
      const fakeId = "00000000-0000-0000-0000-000000000000";
      const res = await api
        .get(`/api/mistakes/${fakeId}`)
        .set("Authorization", `Bearer ${token}`)
        .expect(404);

      expect(res.body.success).toBe(false);
    });

    it("PUT /:id — 更新标题", async () => {
      const res = await api
        .put(`/api/mistakes/${mistakeId}`)
        .set("Authorization", `Bearer ${token}`)
        .send({ title: "已更新标题" })
        .expect(200);

      expect(res.body.data.title).toBe("已更新标题");
    });

    it("DELETE /:id — 删除错题", async () => {
      await api
        .delete(`/api/mistakes/${mistakeId}`)
        .set("Authorization", `Bearer ${token}`)
        .expect(200);

      // 再查应 404
      await api
        .get(`/api/mistakes/${mistakeId}`)
        .set("Authorization", `Bearer ${token}`)
        .expect(404);
    });
  });
});
