import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

import { buildPaginationMeta, MessageResponse, PaginatedResponse } from '../common/entities';
import { PrismaService } from '../common/prisma/prisma.service';
import { ChangeRoleDto } from './dto/change-role.dto';
import { QueryUserDto } from './dto/query-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserEntity, UserStatsEntity } from './entities';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(queryDto: QueryUserDto): Promise<PaginatedResponse<UserEntity>> {
    const { name, email, role, page = 1, limit = 10 } = queryDto;

    const where: Prisma.UserWhereInput = {};
    if (name) where.name = { contains: name };
    if (email) where.email = { contains: email };
    if (role) where.role = { name: role };

    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        include: { role: true },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count({ where }),
    ]);

    const data = users.map(({ password: _, ...user }) => user);

    return {
      data,
      pagination: buildPaginationMeta(page, limit, total),
    };
  }

  async findOne(id: string): Promise<UserEntity> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: { role: true },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    const { password: _, ...result } = user;
    return result;
  }

  async update(id: string, dto: UpdateUserDto): Promise<UserEntity> {
    const existing = await this.prisma.user.findUnique({ where: { id } });

    if (!existing) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    if (dto.email && dto.email !== existing.email) {
      const emailExists = await this.prisma.user.findUnique({
        where: { email: dto.email },
      });

      if (emailExists) {
        throw new ConflictException('User with this email already exists');
      }
    }

    const updateData: Prisma.UserUpdateInput = { ...dto };
    if (dto.password) {
      updateData.password = await bcrypt.hash(dto.password, 10);
    }

    const updated = await this.prisma.user.update({
      where: { id },
      data: updateData,
      include: { role: true },
    });

    const { password: _, ...result } = updated;
    return result;
  }

  async remove(id: string): Promise<MessageResponse> {
    const existing = await this.prisma.user.findUnique({ where: { id } });

    if (!existing) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    const hasFeedback = await this.prisma.feedback.findFirst({
      where: { userId: id },
    });

    if (hasFeedback) {
      throw new BadRequestException(
        'Cannot delete user with existing feedback. Please delete feedback first.',
      );
    }

    await this.prisma.user.delete({ where: { id } });

    return { message: 'User deleted successfully' };
  }

  async changeRole(id: string, dto: ChangeRoleDto): Promise<UserEntity> {
    const existing = await this.prisma.user.findUnique({
      where: { id },
      include: { role: true },
    });

    if (!existing) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    const role = await this.prisma.role.findUnique({
      where: { id: dto.roleId },
    });

    if (!role) {
      throw new NotFoundException(`Role with ID ${dto.roleId} not found`);
    }

    if (existing.roleId === dto.roleId) {
      throw new BadRequestException('User already has this role');
    }

    const updated = await this.prisma.user.update({
      where: { id },
      data: { roleId: dto.roleId },
      include: { role: true },
    });

    const { password: _, ...result } = updated;
    return result;
  }

  async getUserStats(): Promise<UserStatsEntity> {
    const [totalUsers, userRoleCount, adminRoleCount] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { role: { name: 'USER' } } }),
      this.prisma.user.count({ where: { role: { name: 'ADMIN' } } }),
    ]);

    return { totalUsers, userRoleCount, adminRoleCount };
  }
}
