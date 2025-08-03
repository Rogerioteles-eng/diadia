import { Link, useLocation } from "react-router-dom";

export default function Sidebar() {
  const { pathname } = useLocation();
  const menu = [
    { name: "Painel", path: "/painel" },
    { name: "Hábitos", path: "/habitos" },
    { name: "Tarefas", path: "/tarefas" },
    { name: "Metas", path: "/metas" },
    { name: "Terapia", path: "/terapia" },
    { name: "Sair", path: "/logout" },
  ];

  return (
    <div className="w-48 min-h-screen bg-gray-800 text-white flex flex-col p-4">
      <h1 className="text-xl font-bold mb-6">Dia a Dia</h1>
      {menu.map((item) => (
        <Link
          key={item.path}
          to={item.path}
          className={`mb-2 p-2 rounded hover:bg-gray-700 ${
            pathname === item.path ? "bg-gray-700" : ""
          }`}
        >
          {item.name}
        </Link>
      ))}
    </div>
  );
}