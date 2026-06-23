import { IsEnum } from 'class-validator';
import { ServerAction } from '@alexion/shared';

export class ServerActionDto {
  @IsEnum(ServerAction)
  action!: ServerAction;
}
