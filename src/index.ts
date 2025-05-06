import { env } from "cloudflare:workers";
import { Hono } from "hono";

const app = new Hono<{ Bindings: CloudflareBindings }>();
const kv = env.KV;

app.post("/generate", async (c) => {
  const host = c.req.header("hx-current-url")
  const url = (await c.req.formData()).get("url")?.toString();
  if (!url) {
    return c.text("URL is required", 400);
  }
  
  const keys = await kv.list();
  const allValues = keys.keys.map((key) => key.name);
  for (const key of allValues){
    const value = await kv.get(key);
    if (value === url) {
      console.log("URL already exists");
      return c.text(`${host}${key}`);
    }
  }

  const id = crypto.randomUUID().toString().substring(0, 5);

  if(allValues.some((element) => element === id)){ {
    const value = await kv.get(id);
    if (value === url) {
      return c.text(`${host}${id}`);
    }
    else{
      console.log("ID already exists");
      const newId = crypto.randomUUID().toString().substring(0, 5);
      await kv.put(newId, url);
      return c.text(`${host}${newId}`);
    }
  }}

  await kv.put(id, url);

  return c.text(`${host}${id}`);
});


app.get("/:id", async (c) => {
  const id = c.req.param('id');
  if (!id) {
    return c.text("ID is required", 400);
  }

  console.log(id);

  const keys = await kv.list();
  console.log(keys);
  const allValues = keys.keys.map((key) => key.name);
  console.log(allValues);

  if (!allValues.includes(id)) {
    return c.text("URL not found", 404);
  }
  const url = await kv.get(id);
  console.log(url);

  if (!url) {
    return c.text("URL not found", 404);
  }

  return c.redirect(url!);
});

export default app;
