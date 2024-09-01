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

    const usersFilePath = join(Deno.cwd(), "data", "users.json");

    try {
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
        followers: 0, // Initialize followers count
      };

      users[username] = newUser;

      await Deno.writeTextFile(usersFilePath, JSON.stringify(users, null, 2));

      // Properly format the redirect URL
      const redirectUrl = new URL(`/users/${username}`, req.url);

      // Redirect to the user's profile page
      return Response.redirect(redirectUrl.toString(), 303);
    } catch (err) {
      console.error("Error reading or writing users.json:", err);
      return new Response("Internal Server Error", { status: 500 });
    }
  },
};

export default function RegisterPage() {
  return (
    <section class="bg-gray-200">
      <div class="flex flex-col items-center justify-center px-6 py-8 mx-auto md:h-screen lg:py-0">
        <div class="mx-auto">
          <h2 class="text-2xl font-bold mb-5 text-center">Create</h2>
        </div>
        <div class="w-full bg-white rounded-lg shadow md:mt-0 sm:max-w-md xl:p-0">
          <div class="p-6 space-y-4 md:space-y-6 sm:p-8">
            <form class="space-y-4 md:space-y-6" method="POST">
              <div>
                <label for="username" class="block mb-2 text-sm font-medium">Username</label>
                <input type="text" id="username" name="username" class="border border-gray-300 sm:text-sm rounded-lg focus:ring-blue-600 focus:border-blue-600 block w-full p-2.5" placeholder="Type your username..." required/>
              </div>
              <div>
                <label for="displayName" class="block mb-2 text-sm font-medium">Display Name:</label>
                <input type="text" name="displayName" id="displayName" placeholder="Name that is displayed" class="border border-gray-300 sm:text-sm rounded-lg focus:ring-blue-600 focus:border-blue-600 block w-full p-2.5" required/>
              </div>
              <button type="submit" class="w-full text-white bg-blue-600 hover:bg-blue-700 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center">Register</button>
              <p class="text-sm font-light text-gray-500">
                Don't have an account yet? <a href="/signup" class="font-medium text-blue-600 hover:underline">Sign up</a>
              </p>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}