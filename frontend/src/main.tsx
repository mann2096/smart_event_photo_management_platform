import React from "react";
import ReactDOM from "react-dom/client";
import { Provider } from "react-redux";
import { store } from "./app/store";
import App from "./App";
import "./index.css";
import AuthInitializer from "./features/auth/AuthInitializer";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Provider store={store}>
      <AuthInitializer>
        <App />
      </AuthInitializer>
    </Provider>
  </React.StrictMode>
);
