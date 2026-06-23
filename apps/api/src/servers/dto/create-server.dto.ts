import { IsEnum, IsInt, IsOptional, IsString, IsUUID, Max, MaxLength, Min, MinLength } from 'class-validator';
import { ServerType } from '@alexion/shared';

export class CreateServerDto {
  @IsString()
  @MinLength(3)
  @MaxLength(32)
  name!: string;

  @IsEnum(ServerType)
  type!: ServerType;

  /** Optional preferred node; the API picks one automatically if omitted. */
  @IsOptional()
  @IsUUID()
  nodeId?: string;

  @IsOptional()
  @IsInt()
  @Min(256)
  @Max(8192)
  memoryMb?: number;

  @IsOptional()
  @IsInt()
  @Min(8)
  @Max(1000)
  maxPlayers?: number;
}
