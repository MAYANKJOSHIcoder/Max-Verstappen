const UPSTREAM = 'https://livetiming.formula1.com/static';

export default async function handler(req, res) {
  const path = Array.isArray(req.query.path) ? req.query.path : [req.query.path].filter(Boolean);
  if (path.some((part) => part === '..' || part.includes('..'))) {
    res.status(400).json({ error: 'Invalid path' });
    return;
  }

  const upstreamUrl = `${UPSTREAM}/${path.map(encodeURIComponent).join('/')}`;
  const upstream = await fetch(upstreamUrl, {
    headers: {
      'User-Agent': 'max-verstappen-site/1.0',
      Accept: req.headers.accept || '*/*',
    },
  });

  const body = Buffer.from(await upstream.arrayBuffer());
  const contentType = upstream.headers.get('content-type');
  if (contentType) res.setHeader('Content-Type', contentType);
  res.setHeader('Cache-Control', 's-maxage=5, stale-while-revalidate=30');
  res.status(upstream.status).send(body);
}
