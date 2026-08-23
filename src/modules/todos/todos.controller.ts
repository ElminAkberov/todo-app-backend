import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { TodosService } from './todos.service';
import {
  ChangeTodoDto,
  CreateTodoDto,
  GetTodosQueryDto,
} from './dto/todos.dto';
import { AuthGuard } from '../auth/guards/auth/auth.guard';
import type { AuthenticatedRequest } from '../auth/guards/auth/auth.guard';

@Controller('todos')
@UseGuards(AuthGuard)
export class TodosController {
  constructor(private todosService: TodosService) {}

  @Get('')
  @HttpCode(HttpStatus.OK)
  async getTodosController(
    @Query() query: GetTodosQueryDto,
    @Req() req: AuthenticatedRequest,
  ) {
    const { todos, meta } = await this.todosService.getTodos(
      query,
      req.user!.sub,
    );

    return {
      message: 'Todos received successfully',
      data: todos,
      meta,
    };
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async getTodosByIdController(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
  ) {
    const todos = await this.todosService.getTodoById(id, req.user!.sub);

    return {
      message: 'Todos received successfully',
      data: todos,
    };
  }

  @Post('')
  @HttpCode(HttpStatus.CREATED)
  async createTodoController(
    @Body() body: CreateTodoDto,
    @Req() req: AuthenticatedRequest,
  ) {
    const userId = req.user!.sub;
    const todo = await this.todosService.createTodo(body, userId);

    return {
      message: 'Todo created successfully',
      data: todo,
    };
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  async changeTodoByIdController(
    @Param('id') id: string,
    @Body() body: ChangeTodoDto,
    @Req() req: AuthenticatedRequest,
  ) {
    const todos = await this.todosService.changeTodoById(
      id,
      body,
      req.user!.sub,
    );

    return {
      message: 'Todo changed successfully',
      data: todos,
    };
  }

  @Patch(':id/toggle')
  @HttpCode(HttpStatus.OK)
  async toggleTodoByIdController(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
  ) {
    const todos = await this.todosService.toggleTodoById(id, req.user!.sub);

    return {
      message: 'Todo status changed successfully',
      data: todos,
    };
  }

  @Delete(':id/delete')
  @HttpCode(HttpStatus.OK)
  async deleteTodoByIdController(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
  ) {
    const todos = await this.todosService.deleteTodoById(id, req.user!.sub);

    return {
      message: 'Todo deleted successfully',
      data: todos,
    };
  }

  @Delete('delete/completed')
  @HttpCode(HttpStatus.OK)
  async deleteAllCompletedTodosController(@Req() req: AuthenticatedRequest) {
    const todos = await this.todosService.deleteAllCompletedTodos(
      req.user!.sub,
    );

    return {
      message: 'All completed todos deleted successfully',
      data: todos,
    };
  }
}
