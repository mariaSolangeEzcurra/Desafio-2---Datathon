export default function SidebarItem({
    item,
    vista,
    setVista,
    collapsed,
}) {

    const Icon = item.icon;
    const activo = vista === item.id;
    return (
        <button
            onClick={() => setVista(item.id)}
            title={collapsed ? item.label : ""}
            className={`flex w-full items-center rounded-xl px-4 py-3 transition-all
            ${
                activo
                    ? "bg-[#e8f4fc] text-[#006cb7]"
                    : "text-slate-600 hover:bg-slate-100"
            }
            ${collapsed ? "justify-center" : "gap-3"}
            `}
        >
            <Icon size={20} />
            {
                !collapsed && (
                    <span>
                        {item.label}
                    </span>
                )
            }
        </button>
    );
}