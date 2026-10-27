import { agentIndex } from "@/lib/agent-index";

export function GET() {
  return new Response(agentIndex(), {
    headers: { "content-type": "text/plain; charset=utf-8" },
  });
}
