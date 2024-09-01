import { Handlers, PageProps } from "$fresh/server.ts";
import { join } from "https://deno.land/std/path/mod.ts";

interface User {
  username: string;
  displayName: string;
  followers: number;
  profileUrl: string;
  createdAt: string;
}

export const handler: Handlers = {
  async GET(req, ctx) {
    const { username } = ctx.params;

    // Construct an absolute path to the users.json file
    const usersFilePath = join(Deno.cwd(), "data", "users.json");

    try {
      const usersJson = await Deno.readTextFile(usersFilePath);
      const users: Record<string, User> = JSON.parse(usersJson);

      const user = users[username];

      if (!user) {
        return new Response("User not found", { status: 404 });
      }

      return ctx.render(user);
    } catch (err) {
      console.error("Error reading users.json:", err);
      return new Response("Internal Server Error", { status: 500 });
    }
  },
};

export default function ProfilePage({ data }: PageProps<User>) {
  return (
    <section class="bg-gray-200 p-6">
      <div class="max-w-2xl mx-auto bg-white p-6 rounded-lg shadow">
        <h2 class="text-3xl font-bold mb-4">{data.displayName}'s Profile</h2>
        <p><strong>Username:</strong> {data.username}</p>
        <p><strong>Followers:</strong> {data.followers}</p>
        <p><strong>Joined:</strong> {new Date(data.createdAt).toLocaleDateString()}</p>
      </div>
    </section>
  );
}
