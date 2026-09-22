import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, Put } from '@nestjs/common';
import { AddressesService } from './addresses.service';
import { CreateAddressDto } from './dto/create-address.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard'; // Nhớ đường dẫn này phải đúng với file auth của bạn

@UseGuards(JwtAuthGuard) // Toàn bộ API ở đây đều phải có Token
@Controller('addresses')
export class AddressesController {
  constructor(private readonly addressesService: AddressesService) {}

  @Post()
  create(@Request() req, @Body() createAddressDto: CreateAddressDto) {
    return this.addressesService.create(req.user.userId, createAddressDto);
  }

  @Get()
  findAll(@Request() req) {
    return this.addressesService.findAllByUser(req.user.userId);
  }

  @Patch(':id/default')
  setDefault(@Request() req, @Param('id') id: string) {
    return this.addressesService.setDefault(req.user.userId, id);
  }

  @Delete(':id')
  remove(@Request() req, @Param('id') id: string) {
    return this.addressesService.remove(req.user.userId, id);
  }

  @Put(':id')
  update(@Request() req, @Param('id') id: string, @Body() updateAddressDto: Partial<CreateAddressDto>) {
    return this.addressesService.update(req.user.userId, id, updateAddressDto);
  }
}