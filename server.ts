import 'dotenv/config';
import express, { NextFunction, Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import { apiRouter } from './server/routes.ts';
import { db } from './server/db.ts';
import { permissionsManager } from './server/permissionsManager.ts';
import { pgStore } from './server/postgres.ts';
import { apiRateLimiter, configureSecurityMiddleware } from './server/security.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = process.env.NODE_ENV === 'production' && process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  // Connecter l'adaptateur de persistance PostgreSQL
  pgStore.registerAdapters({
    exportDbState: () => db.exportState(),
    hydrateDbState: (state) => db.hydrateState(state),
    exportPerms: () => permissionsManager.exportOverrides(),
    hydratePerms: (overrides) => permissionsManager.hydrateOverrides(overrides),
  });
  await pgStore.initialize();

  // Middlewares de sécurité HTTP (Trust proxy, Helmet, CORS)
  configureSecurityMiddleware(app);
  app.use(express.json({ limit: '15mb' }));

  // Rate limiting & API REST BATI-PILOT
  app.use('/api', apiRateLimiter, apiRouter);

  // Intégration Vite SPA (dev) / Statique build (prod)
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  // Gestionnaire d'erreurs global Express
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    console.error('[BATI-PILOT][Erreur Serveur]', err?.message || err);
    if (res.headersSent) return;
    const status = typeof err?.status === 'number' ? err.status : 500;
    res.status(status).json({
      error: process.env.NODE_ENV === 'production'
        ? 'Une erreur interne est survenue sur le serveur.'
        : err?.message || 'Erreur serveur interne.',
    });
  });

  app.listen(PORT, '0.0.0.0', () => {
    const health = pgStore.getHealth();
    console.log(
      `[BATI-PILOT] Serveur SaaS opérationnel sur http://0.0.0.0:${PORT} (${health.mode.toUpperCase()})`
    );
  });
}

startServer().catch((err) => {
  console.error('[BATI-PILOT] Erreur critique de démarrage serveur:', err);
  process.exit(1);
});
