import request from "supertest";
import crypto from "crypto";
import app from "../src/app";

export const api = request(app);

/** 生成唯一手机号——用时间戳 + 随机数，跨文件不碰撞 */
export function uniquePhone() {
  return `199${Date.now().toString().slice(-7)}${crypto.randomInt(10)}`;
}

/** 注册并返回 token */
export async function registerAndGetToken(phone?: string): Promise<{
  token: string;
  userId: string;
}> {
  const res = await api
    .post("/api/auth/register")
    .send({
      phone: phone || uniquePhone(),
      password: "test123456",
      nickname: "测试选手",
      grade_level: "senior",
    })
    .expect(201);

  return {
    token: res.body.data.token,
    userId: res.body.data.user.id,
  };
}
