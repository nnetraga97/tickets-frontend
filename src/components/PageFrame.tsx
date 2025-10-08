import { useLocation } from "react-router-dom";
import NavBar from "./NavBar";
import AlertToasts from "./AlertsToasts";
import ActionTracker from "./ActionTracker";

export default function PageFrame({ children }: { children: React.ReactNode }) {
    const loc = useLocation();
    const isLogin = loc.pathname === "/login";
    return (
        <div className="min-h-screen bg-gradient-to-b from-neutral-50 to-neutral-100 dark:from-neutral-950 dark:to-neutral-900">
            {!isLogin && <NavBar />}
            {!isLogin && <ActionTracker />}
            <main className="mx-auto max-w-6xl p4">{children}</main>
            {!isLogin && <AlertToasts />}
            <footer className="mx-auto max-w-6xl p-4 text-xs text-center text-neutral-500">
                <p>© {new Date().getFullYear()} Nikhil Netraganti. All rights reserved.</p>
            </footer>
        </div>
    );
}