import Header from "../components/Header";
import Sidebar from "../components/Sidebar";
export default function Supervisor({ onLogout }) {

    return (

        <>
            <Header
                usuario="Supervisor"
                rol="Supervisor"
                onLogout={onLogout}
            />

            {/* resto del dashboard */}

        </>

    )

}