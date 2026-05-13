import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UserGroup } from 'src/entities/user_group.entity';
import { User_ } from 'src/entities/user_.entity';
import { Repository } from 'typeorm';

@Injectable()
export class GroupsService {
  constructor(
    @InjectRepository(UserGroup)
    private readonly groupRepository: Repository<UserGroup>,
    @InjectRepository(User_)
    private readonly userRepository: Repository<User_>,
  ) {}

  findAll(): Promise<UserGroup[]> {
    return this.groupRepository.find({ relations: ['users', 'users.role'] });
  }

  findOne(id: number): Promise<UserGroup | null> {
    return this.groupRepository.findOne({ where: { id }, relations: ['users', 'users.role'] });
  }

  async create(name: string, description: string | null): Promise<UserGroup> {
    const trimmed = name.trim();
    if (!trimmed) throw new BadRequestException('Le nom du groupe est obligatoire.');
    const group = this.groupRepository.create({ name: trimmed, description: description?.trim() || null });
    return this.groupRepository.save(group);
  }

  async update(id: number, name: string, description: string | null): Promise<UserGroup> {
    const group = await this.groupRepository.findOne({ where: { id } });
    if (!group) throw new NotFoundException(`Groupe ${id} introuvable.`);
    group.name = name.trim();
    group.description = description?.trim() || null;
    return this.groupRepository.save(group);
  }

  async remove(id: number): Promise<{ msg: string }> {
    const group = await this.groupRepository.findOne({ where: { id } });
    if (!group) throw new NotFoundException(`Groupe ${id} introuvable.`);
    await this.userRepository
      .createQueryBuilder()
      .update()
      .set({ id_group: null })
      .where('id_group = :id', { id })
      .execute();
    await this.groupRepository.delete({ id });
    return { msg: 'Groupe supprimé.' };
  }

  async assignUser(userId: number, groupId: number | null): Promise<User_> {
    const user = await this.userRepository.findOne({ where: { id_user: userId }, relations: ['role', 'group'] });
    if (!user) throw new NotFoundException(`Utilisateur ${userId} introuvable.`);
    if (groupId !== null) {
      const group = await this.groupRepository.findOne({ where: { id: groupId } });
      if (!group) throw new NotFoundException(`Groupe ${groupId} introuvable.`);
      user.id_group = groupId;
    } else {
      user.id_group = null;
    }
    return this.userRepository.save(user);
  }
}
