import { createWebMcpTools } from "./tools.js";

export async function registerWebMcp(modelContext, controller, options = {}) {
  const tools = createWebMcpTools(controller, options);
  if (!modelContext?.registerTool) {
    return { supported: false, tools, unregister() {} };
  }

  const registrationController = new AbortController();
  await Promise.all(tools.map((tool) => modelContext.registerTool(
    tool,
    { signal: registrationController.signal },
  )));
  return {
    supported: true,
    tools,
    unregister() {
      registrationController.abort();
    },
  };
}