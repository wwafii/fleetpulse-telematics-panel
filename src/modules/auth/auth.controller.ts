import { Controller, Get, Post, Req, Res, Body, Render, UnauthorizedException } from '@nestjs/common';
import { Request, Response } from 'express';
import { AuthService } from './auth.service';

@Controller()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('/')
  index(@Req() req: Request, @Res() res: Response) {
    if (req.session && (req.session as any).user) {
      return res.redirect('/fleets');
    }
    return res.redirect('/login');
  }

  @Get('/login')
  @Render('login')
  getLogin(@Req() req: Request, @Res() res: Response) {
    if (req.session && (req.session as any).user) {
      return res.redirect('/fleets');
    }
    return { error: null };
  }

  @Post('/login')
  async postLogin(
    @Req() req: Request,
    @Res() res: Response,
    @Body() body: any,
  ) {
    const { username, password } = body;
    const isValid = await this.authService.validateUser(username, password);

    const isApi = req.url.startsWith('/api') || 
                  req.path?.startsWith('/api') || 
                  (req.headers['accept'] && req.headers['accept'].includes('application/json'));

    if (isValid) {
      // Store session
      (req.session as any).user = { username };
      
      if (isApi) {
        return res.status(200).json({
          statusCode: 200,
          message: 'Logged in successfully',
        });
      }
      return res.redirect('/fleets');
    } else {
      if (isApi) {
        throw new UnauthorizedException('Invalid credentials');
      }
      return res.render('login', { error: 'Invalid username or password' });
    }
  }

  @Get('/logout')
  async logout(@Req() req: Request, @Res() res: Response) {
    req.session.destroy(() => {
      res.redirect('/login');
    });
  }

  @Post('/logout')
  async postLogout(@Req() req: Request, @Res() res: Response) {
    req.session.destroy(() => {
      const isApi = req.url.startsWith('/api') || 
                    req.path?.startsWith('/api') || 
                    (req.headers['accept'] && req.headers['accept'].includes('application/json'));
      if (isApi) {
        return res.status(200).json({
          statusCode: 200,
          message: 'Logged out successfully',
        });
      }
      res.redirect('/login');
    });
  }
}
