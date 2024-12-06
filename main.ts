// Deno Deploy 版本
const ASSET_URL = 'https://profound-gaufre-eb744c.netlify.app/';
// 前缀，如果自定义路由为 example.com/gh/*，将 PREFIX 改为 '/gh/'，注意，少一个杠都会错！
const PREFIX = '/';
// 分支文件使用 jsDelivr 镜像的开关，0 为关闭，默认关闭
const Config = {
    jsdelivr: 0,
};

const whiteList: string[] = []; // 白名单，路径里面有包含字符的才会通过，e.g. ['/username/']

const PREFLIGHT_INIT = {
    status: 204,
    headers: new Headers({
        'access-control-allow-origin': '*',
        'access-control-allow-methods': 'GET,POST,PUT,PATCH,TRACE,DELETE,HEAD,OPTIONS',
        'access-control-max-age': '1728000',
    }),
};

const exp1 = /^(?:https?:\/\/)?github\.com\/.+?\/.+?\/(?:releases|archive)\/.*$/i;
const exp2 = /^(?:https?:\/\/)?github\.com\/.+?\/.+?\/(?:blob|raw)\/.*$/i;
const exp3 = /^(?:https?:\/\/)?github\.com\/.+?\/.+?\/(?:info|git-).*$/i;
const exp4 = /^(?:https?:\/\/)?raw\.(?:githubusercontent|github)\.com\/.+?\/.+?\/.+?\/.+$/i;
const exp5 = /^(?:https?:\/\/)?gist\.(?:githubusercontent|github)\.com\/.+?\/.+?\/.+$/i;
const exp6 = /^(?:https?:\/\/)?github\.com\/.+?\/.+?\/tags.*$/i;

function makeRes(body: string | null, status = 200, headers: Record<string, string> = {}): Response {
    headers['access-control-allow-origin'] = '*';
    return new Response(body, { status, headers });
}

function newUrl(urlStr: string): URL | null {
    try {
        return new URL(urlStr);
    } catch (err) {
        return null;
    }
}

function checkUrl(u: string): boolean {
    for (const exp of [exp1, exp2, exp3, exp4, exp5, exp6]) {
        if (u.search(exp) === 0) {
            return true;
        }
    }
    return false;
}

async function fetchHandler(req: Request): Promise<Response> {
    const urlStr = req.url;
    const urlObj = new URL(urlStr);
    let path = urlObj.searchParams.get('q');

    if (path) {
        return Response.redirect('https://' + urlObj.host + PREFIX + path, 301);
    }

    path = urlObj.href
        .substring(urlObj.origin.length + PREFIX.length)
        .replace(/^https?:\/+/, 'https://');

    if (
        path.search(exp1) === 0 ||
        path.search(exp5) === 0 ||
        path.search(exp6) === 0 ||
        path.search(exp3) === 0 ||
        path.search(exp4) === 0
    ) {
        return httpHandler(req, path);
    } else if (path.search(exp2) === 0) {
        if (Config.jsdelivr) {
            const newUrl = path
                .replace('/blob/', '@')
                .replace(/^(?:https?:\/\/)?github\.com/, 'https://gcore.jsdelivr.net/gh');
            return Response.redirect(newUrl, 302);
        } else {
            path = path.replace('/blob/', '/raw/');
            return httpHandler(req, path);
        }
    } else if (path.search(exp4) === 0) {
        const newUrl = path
            .replace(/(?<=com\/.+?\/.+?)\/(.+?\/)/, '@$1')
            .replace(/^(?:https?:\/\/)?raw\.(?:githubusercontent|github)\.com/, 'https://gcore.jsdelivr.net/gh');
        return Response.redirect(newUrl, 302);
    } else {
        return fetch(ASSET_URL + path);
    }
}

async function httpHandler(req: Request, pathname: string): Promise<Response> {
    try {
        // 1. 验证输入
        if (!pathname) {
            return makeRes('Invalid path', 400);
        }

        // 2. 预检请求处理
        if (req.method === 'OPTIONS' && req.headers.has('access-control-request-headers')) {
            return new Response(null, PREFLIGHT_INIT);
        }

        // 3. 规范化 URL
        let urlStr = pathname;
        if (!urlStr.startsWith('https://') && !urlStr.startsWith('http://')) {
            urlStr = 'https://' + urlStr;
        }

        // 4. 白名单检查
        const isWhitelisted = whiteList.length === 0 || 
            whiteList.some(pattern => urlStr.includes(pattern));
        
        if (!isWhitelisted) {
            return makeRes('Access denied', 403);
        }

        // 5. URL 解析
        const urlObj = newUrl(urlStr);
        if (!urlObj) {
            return makeRes('Invalid URL', 400);
        }

        // 6. 构建请求配置
        const reqInit: RequestInit = {
            method: req.method,
            headers: new Headers(req.headers),
            redirect: 'manual',
            body: req.body,
        };

        // 7. 添加下载支持
        if (urlStr.includes('/download/') || urlStr.includes('/releases/download/')) {
            reqInit.headers.set('Accept', 'application/octet-stream');
        }

        // 8. 发送代理请求
        return await proxy(urlObj, reqInit);

    } catch (error) {
        console.error('Proxy error:', error);
        return makeRes(
            'Internal server error', 
            500, 
            { 'Content-Type': 'text/plain; charset=utf-8' }
        );
    }
}

async function proxy(urlObj: URL | null, reqInit: RequestInit): Promise<Response> {
    if (!urlObj) {
        return makeRes('Invalid URL', 400);
    }

    const res = await fetch(urlObj.href, reqInit);
    const resHdrOld = res.headers;
    const resHdrNew = new Headers(resHdrOld);
    const status = res.status;

    // 处理下载响应
    if (resHdrOld.get('content-disposition')?.includes('attachment')) {
        // 保持原始文件名和下载标识
        return new Response(res.body, {
            status,
            headers: resHdrOld
        });
    }

    // 其他响应处理保持不变
    if (resHdrNew.has('location')) {
        const _location = resHdrNew.get('location');
        if (_location && checkUrl(_location)) {
            resHdrNew.set('location', PREFIX + _location);
        } else if (_location) {
            reqInit.redirect = 'follow';
            return proxy(newUrl(_location), reqInit);
        }
    }

    resHdrNew.set('access-control-expose-headers', '*');
    resHdrNew.set('access-control-allow-origin', '*');

    resHdrNew.delete('content-security-policy');
    resHdrNew.delete('content-security-policy-report-only');
    resHdrNew.delete('clear-site-data');

    return new Response(res.body, {
        status,
        headers: resHdrNew,
    });
}

addEventListener('fetch', (event) => {
    event.respondWith(
        fetchHandler(event.request).catch((err) =>
            makeRes('Deno Deploy error:\n' + err.stack, 502)
        ),
    );
});