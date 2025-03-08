import type { Route } from "./+types/home";
import Home from "~/components/Home";

export function meta({}: Route.MetaArgs) {
  return [{ title: "Code editor" }];
}

export default function HomePage() {
  return (
    <main className="h-screen">
      <Home />
    </main>
  );
}
