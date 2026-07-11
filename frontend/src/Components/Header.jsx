import { LogOutIcon, BellIcon } from "lucide-react";

export default function Header({ usuario, rol, onLogout }) {
  return (
    <header className="flex items-center justify-end h-16 border-b bg-white px-6">

      <BellIcon className="mr-6 text-slate-500" />

      <div className="mr-6 text-right">
        <h3 className="font-semibold">{usuario}</h3>
        <p className="text-sm text-slate-500">{rol}</p>
      </div>

      <button
        onClick={onLogout}
        className="rounded-full bg-blue-50 p-2 hover:bg-blue-100"
      >
        <LogOutIcon size={20} />
      </button>

    </header>
  );
}