import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { AccountService } from './account.service';
import { CreateUserInput } from './inputs/create-user.input';
import { UserModel } from './models/user.model';
import { Authorized } from '@/src/core/shared/decorators/authorized.decorator';
import { Authorization } from '@/src/core/shared/decorators/auth.decorator';

@Resolver('Account')
export class AccountResolver {
  public constructor(private readonly accountService: AccountService) {}

  @Authorization()
  @Query(() => UserModel, { name: 'findProfile' })
  public async me(@Authorized('id') id: string) {
    return this.accountService.me(id);
  }
  @Mutation(() => UserModel, { name: 'createUser' })
  public async create(@Args('data') input: CreateUserInput) {
    return this.accountService.create(input);
  }
}
