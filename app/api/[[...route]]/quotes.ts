import { db } from "@/db/drizzle";
import { quotes } from "@/db/schema";
import { verifyAuth } from "@hono/auth-js";
import { zValidator } from "@hono/zod-validator";
import { createId } from "@paralleldrive/cuid2";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { z } from "zod";

const schema = z.object({
  text: z.string(),
});

const app = new Hono()
  .get("/", verifyAuth(), async (c) => {
    const quotes = await db.query.quotes.findMany({
      orderBy: (quotes, { desc }) => [desc(quotes.createdAt)],
      with: {
        user: true,
      },
    });

    return c.json(quotes);
  })
  .post("/", verifyAuth(), zValidator("form", schema), async (c) => {
    const auth = c.get("authUser");
    const data = c.req.valid("form");

    if (!auth.user) {
      throw new HTTPException(401);
    }

    const quote = await db
      .insert(quotes)
      .values({
        id: createId(),
        text: data.text,
        userId: auth.user.id,
      })
      .returning();

    return c.json(quote);
  });

export default app;
