import Header from "../components/Header";

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