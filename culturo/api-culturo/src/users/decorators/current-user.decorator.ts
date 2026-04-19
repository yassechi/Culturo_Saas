import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { CURRENT_USER } from 'src/utils/constants';
import { JWTPayloadType } from 'src/utils/types';

export const CurrentUser = createParamDecorator(
  (data, context: ExecutionContext) => {
    const request = context.switchToHttp().getRequest();
    const payload: JWTPayloadType = request[CURRENT_USER];
    return payload;
  },
);
