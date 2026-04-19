import { UpdateUserDTO } from './dtos/update.user.dto';
import { RegisterDTO } from './dtos/register.user.dto';
import { EmailService } from 'src/email/email.service';
import { InjectRepository } from '@nestjs/typeorm';
import { User_ } from 'src/entities/user_.entity';
import { Role } from 'src/entities/role.entity';
import { JWTPayloadType } from 'src/utils/types';
import { ConfigService } from '@nestjs/config';
import { LoginDTO } from './dtos/login.dto';
import bcrypt from 'node_modules/bcryptjs';
import { JwtService } from '@nestjs/jwt';
import { Repository } from 'typeorm';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User_)
    private readonly userRepository: Repository<User_>,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    private readonly jwtService: JwtService,
    private readonly emailService: EmailService,
  ) {}

  /**
   *
   * @returns
   */
  async getAllUsers(): Promise<User_[]> {
    return await this.userRepository.find();
  }

  /**
   *
   * @returns
   */
  async getActiveUsers(): Promise<User_[]> {
    return await this.userRepository.find({ where: { user_active: true } });
  }

  /**
   *
   * @returns
   */
  async getInactivatedUsers(): Promise<User_[]> {
    return await this.userRepository.find({ where: { user_active: false } });
  }

  /**
   *
   * @param id
   * @returns
   */
  async getUserById(id: number): Promise<User_ | null> {
    return this.userRepository.findOneBy({ id_user: id });
  }

  /**
   *
   * @param id
   * @returns
   */
  async setUserActiveStatus(id: number, status: string): Promise<User_> {
    const myStatus: boolean =
      status === 'true' ? true : status === 'false' ? false : false;

    const user = await this.userRepository.findOne({ where: { id_user: id } });
    if (!user) {
      throw new NotFoundException(`Utilisateur avec id ${id} non trouvé`);
    }

    user.user_active = myStatus;
    return await this.userRepository.save(user);
  }

  /**
   *
   * @param updateData
   * @returns
   */
  async updateUser(
    updateData: UpdateUserDTO,
  ): Promise<{ status: number; msg: string }> {
    const user = await this.userRepository.findOne({
      where: { id_user: updateData.id_user },
      relations: ['role'],
    });

    if (!user) {
      return { status: 404, msg: 'Not Found User' };
    }

    // --- Rôle ---
    if (updateData.id_role) {
      const role = await this.roleRepository.findOne({
        where: { id_role: updateData.id_role },
      });

      if (!role) {
        throw new BadRequestException('Role introuvable');
      }

      user.role = role;
      user.id_role = updateData.id_role;
    }

    // --- Mot de passe ---
    if (updateData.hpassword) {
      user.hpassword = await bcrypt.hash(updateData.hpassword, 10);
    }

    // --- Mise à jour des champs simples ---
    if (updateData.user_first_name !== undefined)
      user.user_first_name = updateData.user_first_name;

    if (updateData.user_last_name !== undefined)
      user.user_last_name = updateData.user_last_name;

    if (updateData.birth_day !== undefined)
      user.birth_date = updateData.birth_day;

    if (updateData.email !== undefined) user.email = updateData.email;

    if (updateData.phone !== undefined) user.phone = updateData.phone;

    if (updateData.path_photo !== undefined)
      user.path_photo = updateData.path_photo;

    if (updateData.user_active !== undefined)
      user.user_active = updateData.user_active;

    await this.userRepository.save(user);

    return { status: 200, msg: 'Utilisateur mis à jour avec succès' };
  }

  /**
   *
   * @param registerDto
   * @returns
   */
  public async register(registerDto: RegisterDTO) {
    const { email, hpassword, id_role } = registerDto;

    // Vérification email
    const userFromDb = await this.userRepository.findOne({ where: { email } });
    if (userFromDb) throw new BadRequestException('User already exists');

    // Vérification rôle
    const roleFromDb = await this.roleRepository.findOne({
      where: { id_role },
    });
    if (!roleFromDb) throw new BadRequestException('Role not found');

    // Hash password
    const hashedPassword = await bcrypt.hash(hpassword, 10);

    // Création user
    const newUser = this.userRepository.create({
      ...registerDto,
      hpassword: hashedPassword,
      role: roleFromDb,
      id_role: roleFromDb.id_role,
    });

    const savedUser = await this.userRepository.save(newUser);

    // Envoi de l'email de bienvenue
    try {
      await this.emailService.sendWelcomeEmail(
        savedUser.email,
        savedUser.user_first_name,
        savedUser.user_last_name,
      );
    } catch (error) {
      console.error('Erreur envoi email:', error);
    }

    // JWT Payload - AJOUT DU ROLE
    const payload: JWTPayloadType = {
      id: savedUser.id_user,
      email: savedUser.email,
      role: roleFromDb.role_name, // AJOUTÉ
      id_role: savedUser.id_role,
      nom: savedUser.user_last_name,
      prenom: savedUser.user_first_name,
    };

    const accessToken = await this.jwtService.signAsync(payload);

    return { id: savedUser.id_user, accessToken };
  }

  /**
   * Login In user
   * @param loginDTo data for log in to user account
   * @returns JWT (acces token)
   */
  public async login(loginDto: LoginDTO) {
    const { email, hpassword } = loginDto;

    // IMPORTANT : Charger la relation 'role'
    const userFromDb = await this.userRepository.findOne({
      where: { email },
      relations: ['role'], // AJOUTÉ
    });

    if (!userFromDb) throw new BadRequestException('unregistered user');

    // Vérification du mot de passe
    const isPassMatch = await bcrypt.compare(
      hpassword.trim(),
      userFromDb.hpassword,
    );
    if (!isPassMatch) throw new BadRequestException('invalid password');

    // JWT Payload - AJOUT DU ROLE
    const payload: JWTPayloadType = {
      id: userFromDb.id_user,
      email: userFromDb.email,
      role: userFromDb.role.role_name, // AJOUTÉ
      id_role: userFromDb.id_role,
      nom: userFromDb.user_last_name,
      prenom: userFromDb.user_first_name,
    };

    const accessToken = await this.jwtService.signAsync(payload);

    return {
      id: userFromDb.id_user,
      accessToken,
      role: userFromDb.role.role_name, // Optionnel : retourner le rôle
    };
  }

  /**
   * Get Current user connected (Logged)
   * @param id  Id of the user logged
   * @returns the user from the database
   */
  public async getCurrentUser(id: number): Promise<User_> {
    const user = await this.userRepository.findOneBy({ id_user: id });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }
}
