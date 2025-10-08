const swUrl = new URL(self.location.href);
const VERSION = swUrl.searchParams.get('v') || 'dev';
const CACHE_NAME = `tickets-ui-${VERSION}`;

const ASSET_EXTS = [
    '.js',
    '.css',
    '.ico',
    '.png',
    '.jpg',
    '.jpeg',
    '.svg',
    '.webp',
    '.ttf',
    '.woff2'];

self.addEventListener('install', (event) => {
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        (async () => {
            const keys = await caches.keys();
            await Promise.all(
                keys.map((key) => key.startsWith('tickets-ui-') && key !== CACHE_NAME).map((key) => caches.delete(key)),
            );
            await self.clients.claim();
        })(),
    );
});

self.addEventListener('fetch', (event) => {
    const req = event.request;
    if (req.method !== 'GET') {
        return;
    }

    const accept = req.headers.get('Accept') || '';

    if (accept.includes('text/html')) {
        event.respondWith(
            (async () => {
                try {
                    const fresh = await fetch(req);
                    return fresh;
                } catch {
                    const cache = await caches.open(CACHE_NAME);
                    const cached = await cache.match("/");
                    return cached || new Response('Offline', { status: 503, statusText: 'Offline' });
                }
            })(),
        );
        return;
    }

    const isAsset = ASSET_EXTS.some((ext) => req.url.includes(ext));
    if (!isAsset) {
        event.respondWith(
            (async () => {
                const cache = await caches.open(CACHE_NAME);
                const cached = await cache.match(req);
                if (cached) {
                    return cached;
                }
                try {
                    const resp = await fetch(req);
                    if (resp.ok) {
                        cache.put(req, resp.clone());
                        return resp;
                    }
                } catch {
                    return cached || Response.error();
                }
            })(),
        );
    }
});

// Delete old caches