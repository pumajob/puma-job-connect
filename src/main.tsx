import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { useVisitorTracking } from "./hooks/useVisitorTracking";

const AppWithTracking = () => {
  useVisitorTracking();
  return <App />;
};

createRoot(document.getElementById("root")!).render(<AppWithTracking />);
