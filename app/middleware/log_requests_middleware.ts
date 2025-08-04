import type { HttpContext } from '@adonisjs/core/http';
import logger from '@adonisjs/core/services/logger';

export default class LogRequests {
  async handle({ request, auth }: HttpContext, next: () => Promise<void>) {
    try {
      const user = await auth.authenticate();
      logger.info('API request: %s %s, body: %o, user: %o', request.method(), request.url(), request.all(), { id: user.id, email: user.email });
      await next();
    } catch (error) {
      logger.error('Authentication failed for request: %s %s, error: %o', request.method(), request.url(), error);
      throw error; // Re-throw to ensure the auth middleware handles the response
    }
  }
}