import { useState, useEffect } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import Dashboard from "./Dashboard";
import NaverMap from "./NaverMap";
import { InfoContext } from "./context/InfoContext";
import WeatherDisplay from "./WeatherDisplay";

function App() {
    const [lat, setLat] = useState();
    const [lon, setLon] =  useState();
    const nav = useNavigate();

    useEffect(() => {
        nav('/');
    }, [nav])

    return(
        <InfoContext.Provider value = {{lat, setLat, lon, setLon}}>
            <Routes>
                <Route path = '/' element={<Dashboard></Dashboard>}></Route>
                <Route path = '/navermap' element = {<NaverMap></NaverMap>}></Route>
                <Route path = '/weatherdisplay' element = {<WeatherDisplay></WeatherDisplay>}></Route>

            </Routes>
        </InfoContext.Provider>
    )
    
}

export default App