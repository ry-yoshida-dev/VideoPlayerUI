import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { App } from "./App.js";

const container: HTMLElement | null = document.getElementById("root");
if (container === null) {
  throw new Error("index.html has no #root element");
}
createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
