import { randomUUID } from "node:crypto";
import { z } from "zod";
import { COOKIE_NAME } from "../shared/const";
import { invokeLLM } from "./_core/llm";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";

const shareSessions = new Map<string, {
  id: string;
  token: string;
  expiresAt: number;
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  updatedAt: number;
  active: boolean;
}>();

const shareSessionInput = z.object({
  sessionId: z.string().min(10),
  token: z.string().min(10),
});

function findShareSession(sessionId: string, token: string) {
  const session = shareSessions.get(sessionId);
  if (!session || session.token !== token || session.expiresAt <= Date.now() || !session.active) return null;
  return session;
}

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  share: router({
    start: publicProcedure.mutation(() => {
      const now = Date.now();
      const session = {
        id: randomUUID(),
        token: randomUUID().replace(/-/g, ""),
        expiresAt: now + 60 * 60 * 1000,
        latitude: null,
        longitude: null,
        accuracy: null,
        updatedAt: now,
        active: true,
      };
      shareSessions.set(session.id, session);
      return session;
    }),
    update: publicProcedure
      .input(shareSessionInput.extend({
        latitude: z.number().min(-90).max(90),
        longitude: z.number().min(-180).max(180),
        accuracy: z.number().nonnegative().max(100000).nullable().optional(),
      }))
      .mutation(({ input }) => {
        const session = findShareSession(input.sessionId, input.token);
        if (!session) return { active: false, reason: "expired" as const };
        session.latitude = input.latitude;
        session.longitude = input.longitude;
        session.accuracy = input.accuracy ?? null;
        session.updatedAt = Date.now();
        return { active: true, expiresAt: session.expiresAt, updatedAt: session.updatedAt };
      }),
    get: publicProcedure
      .input(z.object({ sessionId: z.string().min(10), token: z.string().min(10) }))
      .query(({ input }) => {
        const session = shareSessions.get(input.sessionId);
        if (!session || session.token !== input.token || session.expiresAt <= Date.now() || !session.active) {
          return { active: false } as const;
        }
        return {
          active: true as const,
          expiresAt: session.expiresAt,
          latitude: session.latitude,
          longitude: session.longitude,
          accuracy: session.accuracy,
          updatedAt: session.updatedAt,
        };
      }),
    stop: publicProcedure
      .input(shareSessionInput)
      .mutation(({ input }) => {
        const session = shareSessions.get(input.sessionId);
        if (!session || session.token !== input.token) return { stopped: false };
        session.active = false;
        return { stopped: true };
      }),
  }),
  vision: router({
    describe: publicProcedure
      .input(z.object({
        imageDataUri: z.string().startsWith("data:image/").max(18_000_000),
        question: z.string().trim().min(1).max(500),
        language: z.enum(["en", "es", "hi", "ur"]).default("en"),
      }))
      .mutation(async ({ input }) => {
        const languageName = { en: "English", es: "Spanish", hi: "Hindi", ur: "Urdu" }[input.language];
        const response = await invokeLLM({
          model: "gemini-3-flash-preview",
          messages: [
            {
              role: "system",
              content: `You are Visual Guide AI, a cautious visual assistant for a blind person. Answer in ${languageName}. Keep the response under 55 words and make it easy to speak aloud. Describe only what is reasonably visible. If the image is unclear, say so. Never claim that a path is safe and never give medical, legal, or emergency instructions. For walking cues use uncertainty words such as possible, appears, or re-check.`,
            },
            {
              role: "user",
              content: [
                { type: "text", text: input.question },
                { type: "image_url", image_url: { url: input.imageDataUri, detail: "auto" } },
              ],
            },
          ],
          maxTokens: 260,
        });
        const content = response.choices[0]?.message?.content;
        const text = Array.isArray(content) ? content.map((part) => part.type === "text" ? part.text : "").join(" ") : content;
        return { text: (text || "I could not confidently understand the image. Please pause and try again.").trim() };
      }),
  }),
});

export type AppRouter = typeof appRouter;
