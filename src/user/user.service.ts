import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UserService {
    constructor(private readonly prisma: PrismaService) {}

    async updateProfile(userId: string, updateProfileDto: UpdateProfileDto) {
        const updateData = {...updateProfileDto};

        if (updateData.password) {
            updateData.password = await bcrypt.hash(updateData.password, 10);
        }
        
        await this.prisma.user.update({
            where: { id: userId },
            data: updateData,
        });
    }
}