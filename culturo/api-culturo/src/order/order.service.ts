import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateOrderDTO } from './dtos/create.order.dto';
import { UpdateOrderDTO } from './dtos/update.order.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Order } from 'src/entities/order.entity';
import { User_ } from 'src/entities/user_.entity';
import { Repository } from 'typeorm';

@Injectable()
export class OrderService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(User_)
    private readonly userRepository: Repository<User_>,
  ) {}

  /**
   *
   * @returns
   */
  async findAll(): Promise<Order[]> {
    const orders: Order[] = await this.orderRepository.find({
      relations: ['user_', 'orderDetails'],
    });
    return orders;
  }

  /**
   *
   * @param id
   * @returns
   */
  async findOne(id: number): Promise<Order> {
    const order: Order | null = await this.orderRepository.findOne({
      where: { id_order: id },
      relations: ['user_', 'orderDetails'],
    });
    if (!order) throw new NotFoundException('Order not found');
    return order;
  }

  /**
   *
   * @param dto
   * @returns
   */
  async create(dto: CreateOrderDTO): Promise<Order> {
    const user = await this.userRepository.findOne({
      where: { id_user: dto.id_user },
    });
    if (!user) throw new NotFoundException('User not found');

    const order = this.orderRepository.create({
      order_date: dto.order_date,
      order_delivery: dto.order_delivery,
      user_: user,
    });

    return this.orderRepository.save(order);
  }

  /**
   *
   * @param id
   * @param dto
   * @returns
   */
  async update(id: number, dto: UpdateOrderDTO): Promise<Order> {
    const order = await this.findOne(id);

    if (dto.id_user) {
      const user = await this.userRepository.findOne({
        where: { id_user: dto.id_user },
      });
      if (!user) throw new NotFoundException('User not found');
      order.user_ = user;
    }

    if (dto.order_date !== undefined) order.order_date = dto.order_date;
    if (dto.order_delivery !== undefined)
      order.order_delivery = dto.order_delivery;

    return this.orderRepository.save(order);
  }

  /**
   *
   * @param id
   */
  async remove(id: number): Promise<void> {
    const order = await this.findOne(id);
    await this.orderRepository.remove(order);
  }
}
