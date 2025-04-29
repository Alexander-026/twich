import { Args, Context, Mutation, Query, Resolver } from '@nestjs/graphql';
import { SessionService } from './session.service';
import { UserModel } from '../account/models/user.model';
import { GqlContext } from '@/src/core/shared/types/gql-context.types';
import { LoginInput } from './inputs/login.input';
import { UserAgent } from '@/src/core/shared/decorators/user-agent.decorator';
import { Authorization } from '@/src/core/shared/decorators/auth.decorator';
import { SessionModel } from './models/session.model';

@Resolver('Session')
export class SessionResolver {
  public constructor(private readonly sessionService: SessionService) {}

  @Authorization()
  @Query(() => [SessionModel], { name: 'findSessionByUser' })
  public async findByUser(@Context() { req }: GqlContext) {
    return this.sessionService.findByUser(req);
  }
  @Authorization()
  @Query(() => SessionModel, { name: 'findCurrentSession' })
  public async findCurrent(@Context() { req }: GqlContext) {
    return this.sessionService.findCurrent(req);
  }

  @Mutation(() => UserModel, { name: 'loginUser' })
  public async login(
    @Context() { req }: GqlContext,
    @Args('data') input: LoginInput,
    @UserAgent() userAgent: string,
  ) {
    return this.sessionService.loginUser(req, input, userAgent);
  }

  @Authorization()
  @Mutation(() => Boolean, { name: 'logoutUser' })
  public async logout(@Context() { req }: GqlContext) {
    return this.sessionService.logoutUser(req);
  }

  @Authorization()
  @Mutation(() => Boolean, { name: 'clearSession' })
  public async clearSession(@Context() { req }: GqlContext) {
    return this.sessionService.clearSession(req);
  }

  @Authorization()
  @Mutation(() => Boolean, { name: 'removeSession' })
  public async removeSession(
    @Context() { req }: GqlContext,
    @Args('id') id: string,
  ) {
    return this.sessionService.remove(req, id);
  }
}
