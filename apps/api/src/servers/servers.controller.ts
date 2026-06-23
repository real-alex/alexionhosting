import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import type {
  ActionAcceptedResponse,
  AuthUser,
  ServerConsoleResponse,
  ServerDetailResponse,
  ServerListResponse,
} from '@alexion/shared';
import { CurrentUser } from '../auth/current-user.decorator';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';
import { CreateServerDto } from './dto/create-server.dto';
import { ServerActionDto } from './dto/server-action.dto';
import { ServersService } from './servers.service';

@Controller('servers')
@UseGuards(SupabaseAuthGuard)
export class ServersController {
  constructor(private readonly servers: ServersService) {}

  @Get()
  async list(@CurrentUser() user: AuthUser): Promise<ServerListResponse> {
    return { servers: await this.servers.listForUser(user) };
  }

  @Post()
  async create(
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateServerDto,
  ): Promise<ServerDetailResponse> {
    return { server: await this.servers.create(user, dto) };
  }

  @Get(':id')
  async detail(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ServerDetailResponse> {
    return { server: await this.servers.getForUser(user, id) };
  }

  @Post(':id/actions')
  @HttpCode(202)
  async action(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ServerActionDto,
  ): Promise<ActionAcceptedResponse> {
    return this.servers.runAction(user, id, dto.action);
  }

  @Get(':id/console')
  async console(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Query('tail') tail?: string,
  ): Promise<ServerConsoleResponse> {
    const tailLines = tail ? Math.min(Math.max(Number.parseInt(tail, 10) || 200, 1), 1000) : 200;
    return this.servers.getConsole(user, id, tailLines);
  }

  @Delete(':id')
  @HttpCode(204)
  async remove(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    await this.servers.remove(user, id);
  }
}
