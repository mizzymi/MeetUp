import { useEffect } from "react";
import { useLocation } from "react-router-dom";

export function LocationDebug() {
  const loc = useLocation();
  useEffect(() => {
    console.log("🔎 RR pathname:", loc.pathname);
    console.log("🔎 RR search:", loc.search);
    console.log("🔎 window.href:", window.location.href);
    console.log("🔎 window.pathname:", window.location.pathname);
  }, [loc.pathname, loc.search]);
  return null;
}
