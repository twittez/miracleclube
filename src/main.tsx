import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

import "./styles/vars.css";
import "./styles/reset.css";
import "./styles/components.css";

import { CartProvider } from "./contexts/CartContext";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <CartProvider>
      <App />
    </CartProvider>
  </React.StrictMode>
);
