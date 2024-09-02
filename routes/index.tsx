import { Create } from "jsr:@fedify/fedify@0.11.3";

export default function Home() {
    return (
    <div class="px-4 py-8 mx-auto bg-[#86efac]">
      <div class="max-w-screen-md mx-auto flex flex-col items-center justify-center">
        <img
          class="my-6"
          src="/logo.svg"
          width="128"
          height="128"
          alt="the Fresh logo: a sliced lemon dripping with juice"
        />
        <h1 class="text-4xl font-bold">Fedify Next</h1>
          
      </div>
      <div class="mt-10 px-5 mx-auto flex max-w-screen-md flex-col justify-center">
        <div class="mx-auto text-center">
          <h1 class="text-2xl font-bold mb-5">Login to access all pages</h1>
          <a href="/register" type="button" class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">Login</a>
        </div>
      </div>  
    </div>
    
  );
}
