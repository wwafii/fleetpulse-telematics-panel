import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    let message = 'Internal server error';
    if (exception instanceof HttpException) {
      const responseObj = exception.getResponse();
      if (typeof responseObj === 'object' && responseObj !== null) {
        const msg = (responseObj as any).message;
        message = Array.isArray(msg) ? msg.join(', ') : msg || exception.message;
      } else {
        message = exception.message;
      }
    } else if (exception instanceof Error) {
      message = exception.message;
    }

    const isApi = request.url.includes('/api') || 
                  request.path?.includes('/api') || 
                  (request.headers['accept'] && request.headers['accept'].includes('application/json'));

    if (isApi) {
      return response.status(status).json({
        statusCode: status,
        timestamp: new Date().toISOString(),
        path: request.url,
        message,
      });
    } else {
      // For web browser requests, if unauthorized, redirect to /login
      if (status === HttpStatus.UNAUTHORIZED) {
        return response.redirect('/login');
      }

      // Render a friendly error page
      return response.status(status).render('error', {
        statusCode: status,
        message,
        path: request.url,
        user: (request.session as any)?.user || null,
      });
    }
  }
}
