import { Controller, Get, Post, Body, Param, Patch, UseGuards } from '@nestjs/common';
import { ShippingMethodsService } from './shipping-methods.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../users/schemas/user.schema';

@Controller('shipping-methods')
export class ShippingMethodsController {
  constructor(private readonly shippingMethodsService: ShippingMethodsService) {}

  @Get('active')
  getActive() {
    return this.shippingMethodsService.getActiveMethods();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.STORE_OWNER)
  @Post()
  create(@Body() body: any) {
    return this.shippingMethodsService.create(body);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.STORE_OWNER)
  @Patch(':id')
  update(@Param('id') id: string, @Body() body: any) {
    return this.shippingMethodsService.update(id, body);
  }
}