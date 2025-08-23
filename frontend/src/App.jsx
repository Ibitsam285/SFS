import { AuthProvider } from "./context/AuthContext";
import { NotificationsProvider } from "./context/NotificationsContext";
import AppRoutes from "./AppRoutes";

function App() {
  return (
    <AuthProvider>
      <NotificationsProvider>
        <AppRoutes />
      </NotificationsProvider>
    </AuthProvider>
  );
}

export default App;
