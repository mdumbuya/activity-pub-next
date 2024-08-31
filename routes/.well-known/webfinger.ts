import { HandlerContext } from "$fresh/server.ts";
import { join, dirname, fromFileUrl } from "https://deno.land/std/path/mod.ts";

export const handler = async (req: Request, _ctx: HandlerContext) => {
  try {
    const url = new URL(req.url);
    const resource = url.searchParams.get("resource");

    if (!resource) {
      return new Response(JSON.stringify({ error: "Missing 'resource' query parameter" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Determine the absolute path to users.json
    const __dirname = dirname(fromFileUrl(import.meta.url));
    const usersFilePath = join(__dirname, "../../data/user.json");

    // Read the users.json file
    const usersText = await Deno.readTextFile(usersFilePath);
    const users = JSON.parse(usersText);

    // Process the request and generate the response
    const host = "localhost:8000";
    const username = resource.replace(`acct:`, "").replace(`@${host}`, "");

    if (!users[username]) {
      return new Response(JSON.stringify({ error: "User not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    const user = users[username];
    const response = {
      subject: `acct:${username}@${host}`,
      aliases: [`http://${host}${user.profileUrl}`],
      links: [
        {
          rel: "self",
          type: "application/activity+json",
          href: `http://${host}${user.activityUrl}`,
        },
        {
          rel: "http://webfinger.net/rel/profile-page",
          type: "text/html",
          href: `http://${host}${user.profileUrl}`,
        },
      ],
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error handling WebFinger request:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
};