import { Controller, Get, Post, Patch, Put, Delete, Body, Param, Query, Req, Res, UseGuards } from '@nestjs/common';
import { Request, Response } from 'express';
import { FleetService } from './fleet.service';
import { CreateFleetDto } from './dto/create-fleet.dto';
import { UpdateFleetDto } from './dto/update-fleet.dto';
import { DualAuthGuard } from '../auth/guards/dual-auth.guard';
import { VehicleType, FleetStatus } from './entities/fleet.entity';

@Controller()
@UseGuards(DualAuthGuard)
export class FleetController {
  constructor(private readonly fleetService: FleetService) {}

  private isApiRequest(req: Request): boolean {
    return req.url.startsWith('/api') || 
           req.path?.startsWith('/api') || 
           (req.headers['accept'] && req.headers['accept'].includes('application/json'));
  }

  // --- READ ALL FLEETS ---
  @Get(['/fleets', '/api/fleets'])
  async getFleets(
    @Req() req: Request,
    @Res() res: Response,
    @Query('search') search?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    const pageNum = page ? parseInt(page as any, 10) : 1;
    const limitNum = limit ? parseInt(limit as any, 10) : 10;
    
    const result = await this.fleetService.findAll({
      search,
      page: pageNum,
      limit: limitNum,
    });

    if (this.isApiRequest(req)) {
      return res.status(200).json({
        statusCode: 200,
        ...result,
      });
    }

    const stats = await this.fleetService.getDashboardStats();

    // Render Web view
    return res.render('fleet-list', {
      fleets: result.data,
      meta: result.meta,
      stats,
      search: search || '',
      vehicleTypes: Object.values(VehicleType),
      fleetStatuses: Object.values(FleetStatus),
      user: (req.session as any)?.user || null,
    });
  }

  // --- READ SINGLE FLEET ---
  @Get(['/fleets/:id', '/api/fleets/:id'])
  async getFleetDetail(
    @Req() req: Request,
    @Res() res: Response,
    @Param('id') id: string,
  ) {
    const fleet = await this.fleetService.findOne(id);

    if (this.isApiRequest(req)) {
      return res.status(200).json({
        statusCode: 200,
        data: fleet,
      });
    }

    // Render Web view
    return res.render('fleet-detail', {
      fleet,
      user: (req.session as any)?.user || null,
    });
  }

  // --- EXPORT TELEMETRY LOGS CSV ---
  @Get(['/fleets/:id/export', '/api/fleets/:id/export'])
  async exportFleetTelemetry(
    @Req() req: Request,
    @Res() res: Response,
    @Param('id') id: string,
  ) {
    const fleet = await this.fleetService.findOne(id);
    const logs = await this.fleetService.findTelemetryLogs(id);
    
    const headers = ['ID', 'Reported At', 'Location', 'Fuel Level (%)', 'Temperature (C)', 'Alert'];
    const rows = logs.map(log => [
      log.id,
      log.reported_at ? new Date(log.reported_at).toISOString() : '',
      `"${log.current_location.replace(/"/g, '""')}"`,
      log.fuel_level,
      log.temperature,
      log.alert ? `"${log.alert.replace(/"/g, '""')}"` : ''
    ]);
    
    const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=fleet-${fleet.license_plate.replace(/\s+/g, '-')}-telemetry.csv`);
    return res.status(200).send(csvContent);
  }


  // --- CREATE FLEET ---
  @Post(['/fleets', '/api/fleets'])
  async createFleet(
    @Req() req: Request,
    @Res() res: Response,
    @Body() createFleetDto: CreateFleetDto,
  ) {
    const newFleet = await this.fleetService.create(createFleetDto);

    if (this.isApiRequest(req)) {
      return res.status(201).json({
        statusCode: 201,
        message: 'Fleet registered successfully',
        data: newFleet,
      });
    }

    return res.redirect('/fleets');
  }

  // --- UPDATE FLEET ---
  @Post('/fleets/:id/update') // For web form post submissions
  @Patch(['/api/fleets/:id', '/fleets/:id']) // For REST API clients
  @Put(['/api/fleets/:id', '/fleets/:id'])
  async updateFleet(
    @Req() req: Request,
    @Res() res: Response,
    @Param('id') id: string,
    @Body() updateFleetDto: UpdateFleetDto,
  ) {
    // Standard web forms sometimes pass empty strings or values that shouldn't override.
    // Ensure we filter out empty strings for web requests if needed, but standard class-validator is fine.
    const updated = await this.fleetService.update(id, updateFleetDto);

    if (this.isApiRequest(req)) {
      return res.status(200).json({
        statusCode: 200,
        message: 'Fleet updated successfully',
        data: updated,
      });
    }

    return res.redirect(`/fleets/${id}`);
  }

  // --- DELETE FLEET ---
  @Post('/fleets/:id/delete') // For web link/form post actions
  @Delete(['/api/fleets/:id', '/fleets/:id']) // For REST API clients
  async deleteFleet(
    @Req() req: Request,
    @Res() res: Response,
    @Param('id') id: string,
  ) {
    await this.fleetService.remove(id);

    if (this.isApiRequest(req)) {
      return res.status(200).json({
        statusCode: 200,
        message: 'Fleet deleted successfully',
      });
    }

    return res.redirect('/fleets');
  }
}
