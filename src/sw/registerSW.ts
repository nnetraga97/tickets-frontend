export function registerServiceWorker(){
    if("serviceWorker" in navigator){
        const v = (import.meta as any).env.VITE_SW_VERSION ?? "dev";
        const url = `/service-worker.js?v=${encodeURIComponent(v)}`;
        window.addEventListener("load", () =>{
            navigator.serviceWorker
            .register(url,{type:"classic", scope: "/"})
            .catch((e) => console.warn("SW registration failed",e));
        });
    }
}