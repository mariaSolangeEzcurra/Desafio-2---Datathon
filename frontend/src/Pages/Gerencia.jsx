import Header from "../components/Header";
import Sidebar from "../components/Sidebar";
export default function Gerencia({ onLogout }) {

    return (

        <>
            <Header
                usuario="Gerencia"
                rol="Gerencia"
                onLogout={onLogout}
            />

            {/* resto del dashboard */}

        </>

    )

}