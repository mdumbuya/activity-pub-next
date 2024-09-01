import { Handlers } from "$fresh/server.ts";
import { join } from "https://deno.land/std/path/mod.ts";

export const handler: Handlers = {
  async POST(req, _ctx) {
    const formData = await req.formData();
    const username = formData.get("username") as string;
    const displayName = formData.get("displayName") as string;

    if (!username || !displayName) {
      return new Response("Missing fields", { status: 400 });
    }

    // Construct an absolute path to the users.json file
    const usersFilePath = join(Deno.cwd(), "data", "users.json");

    try {
      // Read the JSON file directly
      const usersJson = await Deno.readTextFile(usersFilePath);
      const users: Record<string, any> = JSON.parse(usersJson);

      if (users[username]) {
        return new Response("User already exists", { status: 409 });
      }

      const newUser = {
        username,
        displayName,
        profileUrl: `/@${username}`,
        activityUrl: `/users/${username}`,
        createdAt: new Date().toISOString(),
      };

      users[username] = newUser;

      // Write the updated users object back to the JSON file
      await Deno.writeTextFile(usersFilePath, JSON.stringify(users, null, 2));

      // Return a successful response
      return new Response("User created successfully", { status: 201 });
    } catch (err) {
      console.error("Error reading or writing users.json:", err);
      return new Response("Internal Server Error", { status: 500 });
    }
  },
};

export default function RegisterPage() {
  return (
    <div>
      <h1>Register</h1>
      <form method="POST">
        <label htmlFor="username">Username:</label>
        <input type="text" id="username" name="username" required />
        <br />
        <label htmlFor="displayName">Display Name:</label>
        <input type="text" id="displayName" name="displayName" required />
        <br />
        <button type="submit">Register</button>
      </form>
    </div>
  );
}
