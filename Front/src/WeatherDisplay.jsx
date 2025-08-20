import React, {useState,useContext,useEffect,useRef} from "react";
import { InfoContext } from "./context/InfoContext";

const WeatherDisplay = ({}) => {
    const {lat, lon} = useContext(InfoContext)
console.log(lat,lon)
}

export default WeatherDisplay

