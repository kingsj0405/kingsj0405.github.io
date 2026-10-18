// web-port: 재방문 로딩을 없애려고 unciv.js(61MB)와 assets 를 Cache Storage 에 둔다.
// GitHub Pages 는 max-age=600 이라 10분만 지나도 파일 220개를 다시 확인한다.
// 새 빌드를 배포할 때는 BUILD 를 바꿔야 옛 캐시가 지워진다.
const BUILD = '4.19.12-web-1';
const CACHE = 'unciv-' + BUILD;

self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', (event) => {
    event.waitUntil((async () => {
        for (const key of await caches.keys()) {
            if (key.startsWith('unciv-') && key !== CACHE) await caches.delete(key);
        }
        await self.clients.claim();
    })());
});

self.addEventListener('fetch', (event) => {
    const req = event.request;
    if (req.method !== 'GET' || req.headers.has('range')) return;
    const url = new URL(req.url);
    if (url.origin !== location.origin) return;
    const scope = new URL(self.registration.scope);
    if (!url.pathname.startsWith(scope.pathname)) return;

    const path = url.pathname.slice(scope.pathname.length);
    // index.html·sw.js·preload.txt 는 배포 직후 바로 바뀌어야 하므로 네트워크 우선
    const networkFirst = path === '' || path === 'index.html' || path === 'assets/preload.txt';
    event.respondWith(networkFirst ? fromNetwork(req) : fromCache(req));
});

async function fromCache(req) {
    const cache = await caches.open(CACHE);
    const hit = await cache.match(req, { ignoreSearch: true });
    if (hit) return hit;
    const res = await fetch(req);
    if (res.ok && res.status === 200) cache.put(req, res.clone()).catch(() => {});
    return res;
}

async function fromNetwork(req) {
    const cache = await caches.open(CACHE);
    try {
        const res = await fetch(req);
        if (res.ok && res.status === 200) cache.put(req, res.clone()).catch(() => {});
        return res;
    } catch (e) {
        const hit = await cache.match(req, { ignoreSearch: true });
        if (hit) return hit;
        throw e;
    }
}
