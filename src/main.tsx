import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./app/App";
import { Providers } from "./app/Providers";
import { initializeI18n } from "./shared/i18n";
import "./app/styles/tailwind.css";

void initializeI18n().then(() => {
  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <Providers>
        <App />
      </Providers>
    </StrictMode>,
  );
});
