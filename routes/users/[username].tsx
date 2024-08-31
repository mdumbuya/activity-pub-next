import { HandlerContext } from "$fresh/server.ts";

export const handler = (req: Request, ctx: HandlerContext) => {
  const { username } = ctx.params;

  return new Response(
    JSON.stringify({
      "@context": "https://www.w3.org/ns/activitystreams",
      id: `https://${new URL(req.url).hostname}/users/${username}`,
      type: "Person",
      preferredUsername: username,
      inbox: `https://${new URL(req.url).hostname}/users/${username}/inbox`,
      outbox: `https://${new URL(req.url).hostname}/users/${username}/outbox`,
      followers: `https://${new URL(req.url).hostname}/users/${username}/followers`,
      publicKey: {
        id: `https://${new URL(req.url).hostname}/users/${username}#main-key`,
        owner: `https://${new URL(req.url).hostname}/users/${username}`,
        publicKeyPem: "YOUR_PUBLIC_KEY_HERE", // Replace with your actual public key
      },
    }),
    {
      headers: { "Content-Type": "application/activity+json" },
    }
  );
};
