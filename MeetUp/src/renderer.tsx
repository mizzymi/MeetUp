import React from "react";
import ReactDOM from "react-dom/client";
import "./ui/styles/tailwind.css";
import { BrowserRouter } from "react-router-dom";
import { AppRoutes } from "./app/routes";
import { LocationDebug } from "./ui/routes/LocationDebug";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <BrowserRouter>
    <LocationDebug />
    <AppRoutes />
  </BrowserRouter>
);
