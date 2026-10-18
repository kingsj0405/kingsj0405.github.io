// web-port: GitHub Pages 는 max-age=600 이라 재방문마다 파일 220개를 다시 확인한다.
// 새 빌드를 올릴 때 BUILD 를 바꿔야 옛 캐시가 지워진다.
const CACHE = 'unciv-4.19.12-web-1';

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
        .then(() => self.clients.claim())
));

self.addEventListener('fetch', (event) => {
    const req = event.request;
    if (req.method !== 'GET' || req.headers.has('range') || !req.url.startsWith(self.registration.scope)) return;
    // index.html·preload.txt 는 배포 직후 바로 바뀌어야 한다
    const networkFirst = req.mode === 'navigate' || req.url.endsWith('/preload.txt');
    event.respondWith(caches.open(CACHE).then(async (cache) => {
        const hit = await cache.match(req, { ignoreSearch: true });
        if (hit && !networkFirst) return hit;
        try {
            const res = await fetch(req);
            if (res.status === 200) cache.put(req, res.clone());
            return res;
        } catch (e) {
            if (hit) return hit;
            throw e;
        }
    }));
});
