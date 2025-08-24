import { Navigate } from "react-router-dom";

export default function DashRouter() {
  const user = JSON.parse(localStorage.getItem("user") || "null");
  if (user?.role === "admin") return <Navigate to="/admin" replace />;
  if (user?.role === "user") return <Navigate to="/user" replace />;
  return <Navigate to="/" replace />;
}