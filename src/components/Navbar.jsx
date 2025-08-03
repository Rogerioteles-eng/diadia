// src/components/Navbar.jsx

import { NavLink } from "react-router-dom";
import {
  HomeIcon,
  CheckBadgeIcon,
  ClipboardDocumentListIcon,
  FlagIcon,
  ChatBubbleBottomCenterTextIcon,
  ArrowRightStartOnRectangleIcon,
  XMarkIcon
} from "@heroicons/react/24/outline";
import logoTrilho from '../assets/logo.png'; 

const cn = (...classes) => classes.filter(Boolean).join(' ');

const navLinks = [
  { name: 'Painel', href: '/painel', icon: HomeIcon },
  { name: 'Hábitos', href: '/habitos', icon: CheckBadgeIcon },
  { name: 'Tarefas', href: '/tarefas', icon: ClipboardDocumentListIcon },
  { name: 'Metas', href: '/metas', icon: FlagIcon },
  { name: 'Terapia', href: '/terapia', icon: ChatBubbleBottomCenterTextIcon },
];

export default function Navbar({ isSidebarOpen, setIsSidebarOpen }) {
  return (
    <aside 
      className={cn(
        "fixed inset-y-0 left-0 z-30 flex h-screen w-64 flex-col bg-gray-800 text-white shadow-lg transition-transform duration-300 ease-in-out",
        "md:relative md:translate-x-0",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}
    >
      {/* ✅ CORREÇÃO: As classes 'flex justify-center items-center' garantem o alinhamento central */}
      <div className="p-4 border-b border-gray-700 flex justify-center items-center">
        <img 
          src={logoTrilho} 
          alt="Logo do aplicativo Trilho" 
          className="h-10 w-auto"
        />
        <button onClick={() => setIsSidebarOpen(false)} className="md:hidden p-1 absolute right-2 top-2">
          <XMarkIcon className="h-6 w-6" />
        </button>
      </div>

      <ul className="flex-1 p-2 space-y-2">
        {navLinks.map((item) => (
          <li key={item.name}>
            <NavLink
              to={item.href}
              onClick={() => setIsSidebarOpen(false)}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200',
                  isActive
                    ? 'bg-blue-600 text-white shadow-inner'
                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                )
              }
            >
              <item.icon className="h-6 w-6" />
              <span>{item.name}</span>
            </NavLink>
          </li>
        ))}
      </ul>

      <div className="p-2 border-t border-gray-700">
         <NavLink
            to="/logout"
            className="flex w-full items-center gap-3 px-4 py-2 rounded-md text-sm font-medium text-gray-300 hover:bg-red-600 hover:text-white transition-colors duration-200"
          >
            <ArrowRightStartOnRectangleIcon className="h-6 w-6" />
            <span>Sair</span>
          </NavLink>
      </div>
    </aside>
  );
}