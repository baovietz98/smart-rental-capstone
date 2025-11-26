import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateRoomDto } from './create-room.dto';

// Không cho phép update buildingId (di chuyển phòng sang tòa khác)
export class UpdateRoomDto extends PartialType(
  OmitType(CreateRoomDto, ['buildingId'] as const),
) {}
