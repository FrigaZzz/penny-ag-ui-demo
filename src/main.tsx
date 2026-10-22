import { createRoot } from "react-dom/client";
import { HttpAgent } from "@ag-ui/client";
import { CopilotKitProvider } from "@copilotkit/react-core/v2";
import App from "./App";
import "./styles/base.css";
import "./styles/shell.css";
import "./styles/widgets.css";
import "./styles/views.css";
import "./styles/chat.css";
import "./styles/dialogs.css";

const penny = new HttpAgent({ url: "/api/agent", agentId: "penny" });
createRoot(document.getElementById("root")!).render(
  <CopilotKitProvider
    agents__unsafe_dev_only={{ penny }}
    agentId="penny"
    enableInspector={false}
    showIntelligenceIndicator={false}
  >
    <App />
  </CopilotKitProvider>,
);
