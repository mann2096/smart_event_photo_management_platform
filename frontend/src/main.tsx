import ReactDOM from "react-dom/client";
import { Provider } from "react-redux";
import { store } from "./app/store";
import "./index.css";
import App from "./app/App";
import AuthInitializer from "./features/auth/AuthInitializer";
import { authBootstrap } from "./app/authBootstrap";

const root = document.getElementById("root");

if (!root) {
  throw new Error("Root element not found");
}
authBootstrap(store.dispatch);

ReactDOM.createRoot(document.getElementById("root")!).render(
    <Provider store={store}>
        <AuthInitializer>
          <App />
        </AuthInitializer>
    </Provider>
);
