import { useState, useEffect } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import Dashboard from "./Dashboard";
import { InfoContext } from "./context/InfoContext";

function App() {
    const [lat, setLat] = useState(0.0);
    const [lon, setLon] =  useState(0.0);
    const nav = useNavigate();

    useEffect(() => {
        nav('/');
    }, [nav])

    return(
        <InfoContext.Provider value = {{lat, setLat, lon, setLon}}>
            <Routes>
                <Route path='/' element={<Dashboard></Dashboard>}></Route>

            </Routes>
        </InfoContext.Provider>
    )
    
}

export default App