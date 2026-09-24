import { createFileRoute } from "@tanstack/react-router";
import { AtlasShell } from "@/components/atlas/atlas-shell";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  return <AtlasShell />;
}
