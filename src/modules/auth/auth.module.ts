import { Module, Global } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { DualAuthGuard } from './guards/dual-auth.guard';
import { User } from './entities/user.entity';

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([User])],
  providers: [AuthService, DualAuthGuard],
  controllers: [AuthController],
  exports: [AuthService, DualAuthGuard, TypeOrmModule],
})
export class AuthModule {}
