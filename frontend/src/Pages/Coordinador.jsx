import Header from "../components/Header";

export default function Coodinador({ onLogout }) {

    return (

        <>
            <Header
                usuario="Coodinador"
                rol="Coordinador"
                onLogout={onLogout}
            />

            {/* resto del dashboard */}

        </>

    )

}