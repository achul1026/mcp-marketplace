import { Hono } from 'hono';
import type { Env } from './types';
import { servers } from './routes/servers';
import { auth } from './routes/auth';
import { reviews } from './routes/reviews';
import { dashboard } from './routes/dashboard';

const app = new Hono<{ Bindings: Env }>();

app.route('/', servers);
app.route('/', reviews);
app.route('/', dashboard);
app.route('/auth', auth);

app.onError((err, c) => {
  console.error(err);
  return c.html(`
    <html><body style="background:#0a0a0a;color:#ccc;font-family:sans-serif;padding:2rem">
      <h1>오류가 발생했습니다</h1>
      <p>${err.message}</p>
      <a href="/" style="color:#5865F2">← 홈으로</a>
    </body></html>
  `, 500);
});

export default app;
