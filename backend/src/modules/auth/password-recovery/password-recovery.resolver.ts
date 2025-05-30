import { Args, Context, Mutation, Resolver } from '@nestjs/graphql';
import { PasswordRecoveryService } from './password-recovery.service';
import { GqlContext } from '@/src/core/shared/types/gql-context.types';
import { ResetPasswordInput } from './inputs/reset-password.input';
import { UserAgent } from '@/src/core/shared/decorators/user-agent.decorator';
import { NewPasswordInput } from './inputs/new-password.input';

@Resolver('PasswordRecovery')
export class PasswordRecoveryResolver {
  public constructor(
    private readonly passwordRecoveryService: PasswordRecoveryService,
  ) {}

  @Mutation(() => Boolean, { name: 'resetPassword' })
  public async resetPassword(
    @Context() { req }: GqlContext,
    @Args('data') input: ResetPasswordInput,
    @UserAgent() userAgent: string,
  ) {
    return this.passwordRecoveryService.resetPassword(req, input, userAgent);
  }

  @Mutation(() => Boolean, { name: 'newPassword' })
  public async newPassword(@Args('data') input: NewPasswordInput) {
    return this.passwordRecoveryService.newPassword(input);
  }
}
