import LinkShortener from "@/components/LinkShortener";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-vercel-black p-4">
      <main className="w-full max-w-md rounded-lg border border-vercel-gray-800 bg-vercel-gray-900 p-8 shadow-2xl">
        <h1 className="mb-2 text-center text-3xl font-bold text-white">
          lnkz.my
        </h1>
        <p className="mb-8 text-center text-gray-400">
          Shorten your long URLs with just one click!
        </p>
        <LinkShortener />
      </main>
      <footer className="mt-8 text-sm text-gray-500">
        © {new Date().getFullYear()} lnkz.my. All rights reserved.
      </footer>
    </div>
  );
}
