import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import { useStreamFollow } from "../src/hooks/useStreamFollow";

function Fixture() {
  const [rows, setRows] = useState(1);
  const { workspaceRef, following, scrollToLive } = useStreamFollow("plan", true);
  return <>
    <style>{`@media(max-width:600px){.workspace{height:auto!important;overflow-y:visible!important}}`}</style>
    <button onClick={() => setRows((n) => n + 1)}>Append record</button>
    <button onClick={scrollToLive}>Resume</button>
    <span role="status">{following ? "Following" : "Paused"}</span>
    <main ref={workspaceRef} className="workspace" style={{ height: 300, overflowY: "auto" }}>
      <div><div style={{ height: 80 }}>Intro</div><section className="studio-output">
        {Array.from({ length: rows }, (_, i) => <div key={i} style={{ height: 140 }}>Record {i + 1}</div>)}
      </section><div style={{ height: 800 }}>Static budget below output</div></div>
    </main>
  </>;
}
createRoot(document.getElementById("root")!).render(<Fixture />);
