import Header from "../components/Header";

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