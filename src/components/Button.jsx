// src/components/Button.jsx

import clsx from 'clsx'; // Biblioteca para juntar classes de forma condicional, já está no seu projeto.

// O ...props permite que passemos qualquer outra propriedade de botão (como 'type', 'disabled', etc.)
export default function Button({
  children,
  onClick,
  variant = 'primary', // primary, confirm, secondary, danger
  className = '',      // Permite adicionar classes extras se necessário
  ...props
}) {
  const baseClasses = 'flex items-center justify-center gap-2 w-full sm:w-auto flex-1 sm:flex-none font-bold py-2 px-4 rounded-md transition-colors duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed';

  // Nosso "Design System" de botões
  const variantClasses = {
    primary: 'bg-green-600 hover:bg-green-700 text-white',      // Verde para Adicionar/Criar
    confirm: 'bg-blue-600 hover:bg-blue-700 text-white',       // Azul para Salvar/Confirmar
    secondary: 'bg-gray-200 hover:bg-gray-300 text-gray-800', // Cinza para Cancelar/Ações neutras
    danger: 'bg-red-600 hover:bg-red-700 text-white',         // Vermelho para Excluir
  };

  return (
    <button
      onClick={onClick}
      className={clsx(baseClasses, variantClasses[variant], className)}
      {...props}
    >
      {children}
    </button>
  );
}