import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Force full remount after HMR hook changes
createRoot(document.getElementById("root")!).render(<App />);
