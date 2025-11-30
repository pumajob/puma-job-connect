import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { useVisitorTracking } from "./hooks/useVisitorTracking";
import { useReferralTracking } from "./hooks/useReferralTracking";

const AppWithTracking = () => {
  useVisitorTracking();
  useReferralTracking();
  return <App />;
};

createRoot(document.getElementById("root")!).render(<AppWithTracking />);
