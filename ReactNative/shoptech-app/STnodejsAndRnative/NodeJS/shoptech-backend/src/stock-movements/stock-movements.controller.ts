import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { StockMovementsService } from './stock-movements.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../users/schemas/user.schema';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.STORE_OWNER, Role.STORE_STAFF)
@Controller('stock-movements')
export class StockMovementsController {
  constructor(private readonly stockMovementsService: StockMovementsService) {}

  @Get('all')
  getAll() {
    return this.stockMovementsService.getAllHistory();
  }

  @Get('variant/:variantId')
  getByVariant(@Param('variantId') variantId: string) {
    return this.stockMovementsService.getHistoryByVariant(variantId);
  }
}