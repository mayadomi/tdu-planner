import { Form, Head } from '@inertiajs/react';
import { Bike, Calendar } from 'lucide-react';

import InputError from '@/components/input-error';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import AuthLayout from '@/layouts/auth-layout';
import { login } from '@/routes';
import { store } from '@/routes/register';

interface RegisterProps {
    intent: 'creator' | null;
}

export default function Register({ intent }: RegisterProps) {
    const isCreator = intent === 'creator';

    const title = isCreator ? 'List your event' : 'Create an account';
    const description = isCreator
        ? 'Sign up to list and manage your TDU events and sponsorships'
        : 'Sign up to browse, save, and plan your TDU experience';

    return (
        <AuthLayout title={title} description={description}>
            <Head title={isCreator ? 'Sign up — List your event' : 'Register'} />

            {/* Intent banner */}
            {isCreator ? (
                <div className="mb-2 flex items-start gap-3 rounded-lg border border-orange-200 bg-orange-50 px-4 py-3 dark:border-orange-800 dark:bg-orange-950/30">
                    <Bike className="mt-0.5 size-4 shrink-0 text-orange-600 dark:text-orange-400" />
                    <p className="text-sm text-orange-700 dark:text-orange-300">
                        <strong>Event organiser / sponsor path:</strong> After signing up your editor access request will be submitted automatically for admin approval.
                    </p>
                </div>
            ) : (
                <div className="mb-2 flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 dark:border-blue-800 dark:bg-blue-950/30">
                    <Calendar className="mt-0.5 size-4 shrink-0 text-blue-600 dark:text-blue-400" />
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                        <strong>Free account:</strong> Browse all events, save your favourites, and plan your TDU schedule.
                    </p>
                </div>
            )}

            <Form
                {...store.form()}
                resetOnSuccess={['password', 'password_confirmation']}
                className="flex flex-col gap-6"
            >
                {({ processing, errors }) => (
                    <>
                        {/* Pass intent through the form */}
                        {isCreator && <input type="hidden" name="intent" value="creator" />}

                        <div className="grid gap-6">
                            <div className="grid gap-2">
                                <Label htmlFor="name">Name</Label>
                                <Input
                                    id="name"
                                    type="text"
                                    required
                                    autoFocus
                                    tabIndex={1}
                                    autoComplete="name"
                                    name="name"
                                    placeholder="Full name"
                                />
                                <InputError message={errors.name} className="mt-2" />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="email">Email address</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    required
                                    tabIndex={2}
                                    autoComplete="email"
                                    name="email"
                                    placeholder="email@example.com"
                                />
                                <InputError message={errors.email} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="password">Password</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    required
                                    tabIndex={3}
                                    autoComplete="new-password"
                                    name="password"
                                    placeholder="Password"
                                />
                                <InputError message={errors.password} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="password_confirmation">Confirm password</Label>
                                <Input
                                    id="password_confirmation"
                                    type="password"
                                    required
                                    tabIndex={4}
                                    autoComplete="new-password"
                                    name="password_confirmation"
                                    placeholder="Confirm password"
                                />
                                <InputError message={errors.password_confirmation} />
                            </div>

                            <Button type="submit" className="mt-2 w-full" tabIndex={5} data-test="register-user-button" disabled={processing}>
                                {processing && <Spinner />}
                                {isCreator ? 'Sign up & request editor access' : 'Create account'}
                            </Button>
                        </div>

                        <div className="text-center text-sm text-muted-foreground">
                            Already have an account?{' '}
                            <TextLink href={login()} tabIndex={6}>
                                Log in
                            </TextLink>
                        </div>
                    </>
                )}
            </Form>
        </AuthLayout>
    );
}
