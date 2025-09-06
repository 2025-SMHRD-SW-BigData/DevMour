import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import { InfoProvider } from './context/InfoContext.jsx'

createRoot(document.getElementById('root')).render(
    
        <BrowserRouter>
            <InfoProvider>
                <App />
            </InfoProvider>
        </BrowserRouter>
    
)
