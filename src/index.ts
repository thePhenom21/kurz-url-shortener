import { env } from "cloudflare:workers";
import { Hono } from "hono";
import { sha256 } from "hono/utils/crypto";

const app = new Hono<{ Bindings: CloudflareBindings }>();
const kv = env.KV;


app.post("/generate", async (c) => {
  const host = c.req.header("hx-current-url")
  const url = (await c.req.formData()).get("url")?.toString();
  if (!url) {
    return c.text("URL is required", 400);
  }

  const preliminary_id = await sha256(url)
  const id = preliminary_id ? preliminary_id.slice(0, 8) : null; // take the first 8 characters of the hash
  if (!id) {
    return c.text("ID is required", 400);
  }
  // lets do a different approach -> hash the url
  if(await kv.get(id)){
    console.log("URL already exists");
    return c.text(`${host}${id}`);
  }

  await kv.put(id, url);

  return c.text(`${host}${id}`);
});


app.get("/:id", async (c) => {
  const id = c.req.param('id');
  if (!id) {
    return c.text("ID is required", 400);
  }

  console.log(id);

  const url = await kv.get(id);

  
  if (!url) {
    return c.text("URL not found", 404);
  }
  console.log(url);


  return c.redirect(url);
});

export default app;
