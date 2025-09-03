import React from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
// import "libs/mvx/custom.css";
import { BrowserRouter as Router } from "react-router-dom";
import App from "./App";

const container = document.getElementById("root");
const root = createRoot(container as HTMLElement);
root.render(
  <Router>
    <App />
  </Router>
);
