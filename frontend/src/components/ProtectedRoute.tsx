import { useEffect, useState } from "react";
import { Navigate, Outlet, useNavigate } from "react-router-dom";

export default function ProtectedRoute() {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(() => Boolean(localStorage.getItem("access")));

  useEffect(() => {
    const checkAuth = () => {
      const hasToken = Boolean(localStorage.getItem("access"));
      setIsAuthenticated(hasToken);

      if (!hasToken) {
        navigate("/login", { replace: true });
      }
    };

    window.addEventListener("pageshow", checkAuth);
    window.addEventListener("focus", checkAuth);
    window.addEventListener("popstate", checkAuth);

    return () => {
      window.removeEventListener("pageshow", checkAuth);
      window.removeEventListener("focus", checkAuth);
      window.removeEventListener("popstate", checkAuth);
    };
  }, [navigate]);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
