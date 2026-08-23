import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import {
  ChangeTodoDto,
  CreateTodoDto,
  GetTodosQueryDto,
  SortOrder,
  TodoSortBy,
} from './dto/todos.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TodosService {
  constructor(private prisma: PrismaService) {}

  async createTodo(body: CreateTodoDto, userId: string) {
    const { title, priority, completed } = body;

    const findTodo = await this.prisma.todo.findFirst({
      where: { title, userId },
    });

    if (findTodo) {
      throw new HttpException('Todo already exists', HttpStatus.CONFLICT);
    }

    const todo = await this.prisma.todo.create({
      data: {
        title,
        priority,
        completed,
        userId,
      },
    });

    return todo;
  }

  async getTodos(query: GetTodosQueryDto, userId: string) {
    const {
      priority,
      page = 1,
      limit = 10,
      search,
      sortBy = TodoSortBy.CREATED_AT,
      sortOrder = SortOrder.DESC,
    } = query;

    const where = {
      userId,
      ...(priority && { priority }),
      ...(search && {
        title: { contains: search, mode: 'insensitive' as const },
      }),
    };

    const [todos, total] = await this.prisma.$transaction([
      this.prisma.todo.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.todo.count({ where }),
    ]);

    return {
      todos,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getTodoById(id: string, userId: string) {
    const findTodo = await this.prisma.todo.findFirst({
      where: { id, userId },
    });

    if (!findTodo) {
      throw new HttpException('Todo not found', HttpStatus.NOT_FOUND);
    }

    return findTodo;
  }

  async changeTodoById(id: string, body: ChangeTodoDto, userId: string) {
    const { title, priority } = body;

    const findTodo = await this.prisma.todo.findFirst({
      where: { id, userId },
    });

    if (!findTodo) {
      throw new HttpException('Todo not found', HttpStatus.NOT_FOUND);
    }

    if (!title && !priority) {
      throw new HttpException('No fields to update', HttpStatus.BAD_REQUEST);
    }

    return this.prisma.todo.update({
      where: { id },
      data: {
        title,
        priority,
      },
    });
  }

  async toggleTodoById(id: string, userId: string) {
    const findTodo = await this.prisma.todo.findFirst({
      where: { id, userId },
    });

    if (!findTodo) {
      throw new HttpException('Todo not found', HttpStatus.NOT_FOUND);
    }

    return this.prisma.todo.update({
      where: { id },
      data: {
        completed: !findTodo.completed,
      },
    });
  }

  async deleteTodoById(id: string, userId: string) {
    const findTodo = await this.prisma.todo.findFirst({
      where: { id, userId },
    });

    if (!findTodo) {
      throw new HttpException('Todo not found', HttpStatus.NOT_FOUND);
    }

    return this.prisma.todo.delete({ where: { id } });
  }

  async deleteAllCompletedTodos(userId: string) {
    const deletedTodos = await this.prisma.todo.deleteMany({
      where: { userId, completed: true },
    });

    return {
      message: 'All completed todos deleted successfully',
      data: deletedTodos,
    };
  }
}
