import { IsOptional, IsBoolean, IsNumber } from 'class-validator';
import { ApiProperty, PartialType, PickType } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { CreateCommentDto } from './create-comment.dto';

export class UpdateCommentDto extends PartialType(
  PickType(CreateCommentDto, [
    'message',
    'details',
    'reference',
    'url',
  ] as const),
) {
  @ApiProperty({ example: 1, required: true })
  @IsNumber()
  @Type(() => Number)
  id: number;

  @ApiProperty({ example: false, required: false })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true')
  resolved?: boolean;
}
