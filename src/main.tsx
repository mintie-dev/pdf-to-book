import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Restore saved theme before first render to avoid flash
const savedTheme = localStorage.getItem('reader-theme');
if (savedTheme === 'dark' || savedTheme === 'warm-blush') {
  document.documentElement.classList.add(savedTheme);
}

createRoot(document.getElementById("root")!).render(<App />);
