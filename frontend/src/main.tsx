import ReactDOM from "react-dom/client";
import { Provider } from "react-redux";
import { store ,persistor} from "./app/store";
import "./index.css";
import App from "./app/App";
import AuthInitializer from "./features/auth/AuthInitializer";
import { authBootstrap } from "./app/authBootstrap";
import { PersistGate } from "redux-persist/integration/react";

const root = document.getElementById("root");
if (!root) {
  throw new Error("Root element not found");
}
authBootstrap(store.dispatch);

ReactDOM.createRoot(document.getElementById("root")!).render(
    <Provider store={store}>
        <AuthInitializer>
          <PersistGate loading={null} persistor={persistor}>
          <App />
        </PersistGate>
        </AuthInitializer>
    </Provider>
);
