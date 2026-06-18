import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthService } from '../auth.service';

@Injectable()
export class DualAuthGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    
    // Check if it is an API request (has /api prefix or expects JSON response)
    const isApi = request.url.startsWith('/api') || 
                  request.path?.startsWith('/api') || 
                  (request.headers['accept'] && request.headers['accept'].includes('application/json'));
    
    if (isApi) {
      const apiKey = request.headers['x-api-key'];
      if (!apiKey || !this.authService.validateApiKey(apiKey as string)) {
        throw new UnauthorizedException('Invalid or missing API key (x-api-key)');
      }
      return true;
    } else {
      // Session validation for the web panel
      if (!request.session || !request.session.user) {
        throw new UnauthorizedException('Session authentication required. Please login.');
      }
      return true;
    }
  }
}
