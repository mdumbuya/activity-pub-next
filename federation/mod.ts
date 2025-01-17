import {
    Accept,
    Endpoints,
    Follow,
    Person,
    Undo,
    createFederation,
    exportJwk,
    generateCryptoKeyPair,
    importJwk,
  } from "jsr:@fedify/fedify@0.11.3";
  import {
    DenoKvMessageQueue,
    DenoKvStore,
  } from "jsr:@fedify/fedify@0.11.3/x/denokv";
  import { configure, getConsoleSink } from "jsr:@logtape/logtape@0.4.2";
  
  // Logging settings for diagnostics:
  await configure({
    sinks: { console: getConsoleSink() },
    filters: {},
    loggers: [
      { category: "fedify", level: "debug", sinks: ["console"], filters: [] },
      { category: ["logtape", "meta"], level: "warning", sinks: ["console"], filters: [] },
    ],
  });
  
  // We'll use a Deno KV database for storing the list of followers and cache:
  const kv = await Deno.openKv();
  
  // A `Federation` object is the main entry point of the Fedify framework.
  // It provides a set of methods to configure and run the federated server:
  const federation = createFederation<void>({
    kv: new DenoKvStore(kv),
  });
  
  // Registers the actor dispatcher, which is responsible for creating a
  // `Actor` object (`Person` in this case) for a given actor URI.
  // The actor dispatch is not only used for the actor URI, but also for
  // the WebFinger resource:
  federation.setActorDispatcher("/users/{handle}", async (ctx, handle) => {
    // In this demo, we're assuming that there is only one account for
    // this server: @demo@fedify-demo.deno.land
    if (handle != "demo") return null;
    // A `Context<TContextData>` object has several purposes, and one of
    // them is to provide a way to get the key pairs for the actor in various
    // formats:
    const keyPairs = await ctx.getActorKeyPairs(handle);
    return new Person({
      id: ctx.getActorUri(handle),
      name: "Fedify Demo",
      summary: "This is a Fedify Demo account.",
      preferredUsername: handle,
      url: new URL("/", ctx.url),
      inbox: ctx.getInboxUri(handle),
      endpoints: new Endpoints({
        sharedInbox: ctx.getInboxUri(),
      }),
      // The `publicKey` and `assertionMethods` are used by peer servers
      // to verify the signature of the actor:
      publicKey: keyPairs[0].cryptographicKey,
      assertionMethods: keyPairs.map((keyPair) => keyPair.multikey),
    });
  })
    .setKeyPairsDispatcher(async (_, handle) => {
      if (handle != "demo") return null;
      const entry = await kv.get<{ privateKey: JsonWebKey, publicKey: JsonWebKey }>(["key"]);
      if (entry == null || entry.value == null) {
        // Generate a new key pair at the first time:
        const { privateKey, publicKey } = await generateCryptoKeyPair();
        // Store the generated key pair to the Deno KV database in JWK format:
        await kv.set(
          ["key"],
          {
            privateKey: await exportJwk(privateKey),
            publicKey: await exportJwk(publicKey),
          }
        );
        return { privateKey, publicKey };
      }
      // Load the key pair from the Deno KV database:
      const privateKey = await importJwk(entry.value.privateKey, "private");
      const publicKey =  await importJwk(entry.value.publicKey, "public");
      return [{ privateKey, publicKey }];
    });
  
  // Registers the inbox listeners, which are responsible for handling
  // incoming activities in the inbox:
  federation.setInboxListeners("/users/{handle}/inbox", "/inbox")
    // The `Follow` activity is handled by adding the follower to the
    // follower list:
    .on(Follow, async (ctx, follow) => {
      if (follow.id == null || follow.actorId == null || follow.objectId == null) {
        return;
      }
      const handle = ctx.getHandleFromActorUri(follow.objectId);
      if (handle != "demo") return;
      const follower = await follow.getActor(ctx);
      // Note that if a server receives a `Follow` activity, it should reply
      // with either an `Accept` or a `Reject` activity.  In this case, the
      // server automatically accepts the follow request:
      await ctx.sendActivity(
        { handle },
        follower,
        new Accept({
          id: new URL(`#accepts/${follower.id.href}`, ctx.getActorUri("demo")),
          actor: follow.objectId,
          object: follow
        }),
      );
      await kv.set(["followers", follow.id.href], follow.actorId.href);
    })
    // The `Undo` activity purposes to undo the previous activity.  In this
    // project, we use the `Undo` activity to represent someone unfollowing
    // this demo app:
    .on(Undo, async (ctx, undo) => {
      const activity = await undo.getObject(ctx); // An `Activity` to undo
      if (activity instanceof Follow) {
        if (activity.id == null) return;
        await kv.delete(["followers", activity.id.href]);
      } else {
        console.debug(undo);
      }
    });

    export default federation;
  
/**
 *   Deno.serve(async (req: Request) => {
    const url = new URL(req.url);
    // The home page:
    if (url.pathname === "/") {
      const followers: string[] = [];
      for await (const entry of kv.list({ prefix: ["followers"] })) {
        if (followers.includes(entry.value)) continue;
        followers.push(entry.value);
      }
      return new Response(`\
   _____        _ _  __         ____
  |  ___|__  __| (_)/ _|_   _  |  _ \\  ___ _ __ ___   ___
  | |_ / _ \\/ _\` | | |_| | | | | | | |/ _ \\ '_ \` _ \\ / _ \\
  |  _|  __/ (_| | |  _| |_| | | |_| |  __/ | | | | | (_) |
  |_|  \\___|\\__,_|_|_|  \\__, | |____/ \\___|_| |_| |_|\\___/
                        |___/
  
  This small federated server app is a demo of Fedify.  The only one
  thing it does is to accept follow requests.
  
  You can follow this demo app via the below handle:
  
      @demo@${url.host}
  
  This account has the below ${followers.length} followers:
  
      ${followers.join("\n    ")}
  `);
    }
  
    // The `federation` object purposes to handle federation-related requests.
    // It is responsible for handling, for example, WebFinger queries, actor
    // dispatching, and incoming activities to the inbox:
    return await federation.fetch(req, {
      // The context data is not used in this example, but it can be used to
      // store data (e.g., database connections) that is shared between
      // the different federation-related callbacks:
      contextData: undefined,
    });
  });
 */
  