import { Controller, Post, Delete, Param, Body, Req, Res, UseGuards } from '@nestjs/common';
import { Request, Response } from 'express';
import { TrackingService } from './tracking.service';
import { CreateTrackingLogDto } from './dto/create-tracking-log.dto';
import { DualAuthGuard } from '../auth/guards/dual-auth.guard';

@Controller()
@UseGuards(DualAuthGuard)
export class TrackingController {
  constructor(private readonly trackingService: TrackingService) {}

  private isApiRequest(req: Request): boolean {
    return req.url.startsWith('/api') || 
           req.path?.startsWith('/api') || 
           (req.headers['accept'] && req.headers['accept'].includes('application/json'));
  }

  @Post(['/tracking-logs', '/api/tracking-logs', '/tracking', '/api/tracking'])
  async createTrackingLog(
    @Req() req: Request,
    @Res() res: Response,
    @Body() createTrackingLogDto: CreateTrackingLogDto,
  ) {
    const result = await this.trackingService.create(createTrackingLogDto);

    if (this.isApiRequest(req)) {
      return res.status(201).json({
        statusCode: 201,
        message: 'Tracking log registered successfully',
        alert: result.alert,
        data: result.log,
      });
    }

    // Standard web request redirects to the fleet's detail page
    return res.redirect(`/fleets/${createTrackingLogDto.fleet_id}`);
  }

  @Post('/tracking-logs/:id/delete') // For web form actions
  @Delete(['/api/tracking-logs/:id', '/tracking-logs/:id']) // For REST API clients
  async deleteTrackingLog(
    @Req() req: Request,
    @Res() res: Response,
    @Param('id') id: string,
  ) {
    const fleetId = await this.trackingService.remove(id);

    if (this.isApiRequest(req)) {
      return res.status(200).json({
        statusCode: 200,
        message: 'Tracking log deleted successfully',
      });
    }

    return res.redirect(`/fleets/${fleetId}`);
  }
}

