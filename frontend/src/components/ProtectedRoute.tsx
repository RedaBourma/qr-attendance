import { useEffect, useState } from "react";
import { Navigate, Outlet, useNavigate } from "react-router-dom";

interface ProtectedRouteProps {
  allowedRoles?: string[];
  children?: React.ReactNode;
}

function getStoredRole() {
  try {
    const rawUser = localStorage.getItem("user");
    return rawUser ? JSON.parse(rawUser).role : "";
  } catch {
    return "";
  }
}

export default function ProtectedRoute({ allowedRoles, children }: ProtectedRouteProps) {
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

  if (allowedRoles && !allowedRoles.includes(getStoredRole())) {
    const role = getStoredRole();
    const fallback = role === "admin" ? "/statistiques" : role === "enseignant" ? "/dashboard" : "/seances";
    return <Navigate to={fallback} replace />;
  }

  return children ? <>{children}</> : <Outlet />;
}
