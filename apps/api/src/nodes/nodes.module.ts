import { Module } from '@nestjs/common';
import { AgentClient } from './agent.client';
import { NodesService } from './nodes.service';

@Module({
  providers: [NodesService, AgentClient],
  exports: [NodesService, AgentClient],
})
export class NodesModule {}
