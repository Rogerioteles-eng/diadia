import { useEffect } from "react";
import { logout } from "../auth";
import { useNavigate } from "react-router-dom";

export default function Logout() {
  const navigate = useNavigate();

  useEffect(() => {
    logout().then(() => navigate("/login"));
  }, [navigate]);

  return <div className="p-4">Saindo...</div>;
}