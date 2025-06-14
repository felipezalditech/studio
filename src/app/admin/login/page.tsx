
"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

export default function UnifiedLoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);

    // Simulação de login
    setTimeout(() => {
      if (email === 'admin@zaldi.com' && password === 'password') {
        localStorage.setItem('adminLoggedIn', 'true');
        localStorage.removeItem('userLoggedIn'); // Garante que apenas um tipo de usuário esteja logado
        toast({
          title: 'Login de Administrador bem-sucedido!',
          description: 'Redirecionando para o painel de administração...',
        });
        router.push('/admin/dashboard');
      } else if (email === 'cliente@empresa.com' && password === 'cliente123') {
        localStorage.setItem('userLoggedIn', 'true');
        localStorage.removeItem('adminLoggedIn'); // Garante que apenas um tipo de usuário esteja logado
        toast({
          title: 'Login de Cliente bem-sucedido!',
          description: 'Redirecionando para a aplicação...',
        });
        router.push('/'); // Redireciona para a página inicial da aplicação cliente
      } else {
        toast({
          title: 'Erro de login',
          description: 'Email ou senha inválidos.',
          variant: 'destructive',
        });
        setIsLoading(false);
      }
    }, 1000);
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Login Zaldi Imo</CardTitle>
          <CardDescription>Acesse sua conta ou o painel de administração.</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                placeholder="********"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Entrando...' : 'Entrar'}
            </Button>
          </CardFooter>
        </form>
      </Card>
       <p className="mt-4 text-xs text-muted-foreground text-center">
        Para Administrador: admin@zaldi.com / password<br/>
        Para Cliente (teste): cliente@empresa.com / cliente123
      </p>
    </div>
  );
}
