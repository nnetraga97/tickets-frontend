import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import Login from "./pages/Login";
import TicketsAll from './pages/TicketsAll';
import TicketDetail from "./pages/TicketDetail";
import Account from "./pages/Account";
import Settings from "./pages/Settings";
import { useAuth } from './store/auth';
import { useEffect, JSX } from "react";
import { useLogger } from './store/logger';
import Logs from "./pages/Logs";
import Perf from "./pages/Perf";

function RequireAuth({ children }: { children: JSX.Element }) {
    const { isAuthenticated } = useAuth();
    const location = useLocation();
    const { logWarn, logInfo } = useLogger();
    
    if (!isAuthenticated) {
        logWarn('RequireAuth_redirect_to_login', { 
            attemptedPath: location.pathname,
            search: location.search,
            state: location.state
        }, 'router.tsx');
        return <Navigate to="/login" state={{ from: location }} replace />;
    }
    
    return children;
}

export default function AppRouter() {
    const { logEvent, logInfo, logDebug } = useLogger();
    const location = useLocation();

    useEffect(() => {
        const isInitialLoad = !document.referrer || document.referrer === window.location.href;
        
        logInfo('router_page_view', { 
            path: location.pathname,
            search: location.search,
            hash: location.hash,
            state: location.state,
            isInitialLoad,
            timestamp: Date.now()
        }, 'router.tsx');
        
        logEvent('page_view', { path: location.pathname });
    }, [location.pathname, location.search, location.hash, logEvent, logInfo]);

    return (
        <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<RequireAuth><TicketsAll /></RequireAuth>} />
            <Route path="/tickets/:id" element={<RequireAuth><TicketDetail /></RequireAuth>} />
            <Route path="/logs" element={<RequireAuth><Logs /></RequireAuth>} />
            <Route path="/account" element={<RequireAuth><Account /></RequireAuth>} />
            <Route path="/settings" element={<RequireAuth><Settings /></RequireAuth>} />
            <Route path="/perf" element={<RequireAuth><Perf /></RequireAuth>} />
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
}
