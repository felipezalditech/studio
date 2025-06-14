
"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useLoginScreenBranding } from '@/hooks/useLoginScreenBranding';
import { cn } from '@/lib/utils';

export default function UnifiedLoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loginScreenBranding] = useLoginScreenBranding();
  
  const [currentLogoUrl, setCurrentLogoUrl] = useState<string>('');
  const [currentBackgroundImageUrl, setCurrentBackgroundImageUrl] = useState<string>('');
  const [currentLoginButtonColor, setCurrentLoginButtonColor] = useState<string | undefined>(undefined);
  const [currentCardBackgroundColor, setCurrentCardBackgroundColor] = useState<string | undefined>(undefined);
  const [currentInputBackgroundColor, setCurrentInputBackgroundColor] = useState<string | undefined>(undefined);
  const [currentInputBorderColor, setCurrentInputBorderColor] = useState<string | undefined>(undefined);
  const [currentLabelTextColor, setCurrentLabelTextColor] = useState<string | undefined>(undefined);
  const [currentDescriptionTextColor, setCurrentDescriptionTextColor] = useState<string | undefined>(undefined);


  useEffect(() => {
    setCurrentLogoUrl(loginScreenBranding.logoUrl);
    setCurrentBackgroundImageUrl(loginScreenBranding.backgroundImageUrl);
    setCurrentLoginButtonColor(loginScreenBranding.loginButtonColor);
    setCurrentCardBackgroundColor(loginScreenBranding.cardBackgroundColor);
    setCurrentInputBackgroundColor(loginScreenBranding.inputBackgroundColor);
    setCurrentInputBorderColor(loginScreenBranding.inputBorderColor);
    setCurrentLabelTextColor(loginScreenBranding.labelTextColor);
    setCurrentDescriptionTextColor(loginScreenBranding.descriptionTextColor);
  }, [loginScreenBranding]);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);

    setTimeout(() => {
      if (email === 'admin@zaldi.com' && password === 'password') {
        localStorage.setItem('adminLoggedIn', 'true');
        localStorage.removeItem('userLoggedIn'); 
        toast({
          title: 'Login de administrador bem-sucedido!',
          description: 'Redirecionando para o painel de administração...',
        });
        router.push('/admin/dashboard');
      } else if (email === 'cliente@empresa.com' && password === 'cliente123') {
        localStorage.setItem('userLoggedIn', 'true');
        localStorage.removeItem('adminLoggedIn'); 
        toast({
          title: 'Login de cliente bem-sucedido!',
          description: 'Redirecionando para a aplicação...',
        });
        router.push('/'); 
      } else {
        toast({
          title: 'Erro de login',
          description: 'E-mail ou senha inválidos.',
          variant: 'destructive',
        });
      }
      setIsLoading(false);
    }, 1000);
  };

  const leftPanelStyle: React.CSSProperties = {
    backgroundColor: currentCardBackgroundColor || 'hsl(var(--background))',
  };

  const rightPanelStyle: React.CSSProperties = {};
  if (currentBackgroundImageUrl) {
    rightPanelStyle.backgroundImage = `url(${currentBackgroundImageUrl})`;
    rightPanelStyle.backgroundSize = 'cover';
    rightPanelStyle.backgroundPosition = 'center';
    rightPanelStyle.backgroundRepeat = 'no-repeat';
  } else {
    rightPanelStyle.backgroundColor = 'hsl(var(--muted) / 0.4)';
  }


  const inputStyle: React.CSSProperties = {};
  if (currentInputBackgroundColor) {
    inputStyle.backgroundColor = currentInputBackgroundColor;
  }
  if (currentInputBorderColor) {
    inputStyle.borderColor = currentInputBorderColor;
  }
  
  const labelStyle: React.CSSProperties = {};
  if (currentLabelTextColor) {
    labelStyle.color = currentLabelTextColor;
  }

  const descriptionStyle: React.CSSProperties = {};
  if (currentDescriptionTextColor) {
    descriptionStyle.color = currentDescriptionTextColor;
  }

  const loginButtonStyle: React.CSSProperties = {};
  if (currentLoginButtonColor) {
    loginButtonStyle.backgroundColor = currentLoginButtonColor;
    const hex = currentLoginButtonColor.replace('#', '');
    if (hex.length === 3 || hex.length === 6) {
        let r, g, b;
        if (hex.length === 3) {
            r = parseInt(hex[0] + hex[0], 16);
            g = parseInt(hex[1] + hex[1], 16);
            b = parseInt(hex[2] + hex[2], 16);
        } else {
            r = parseInt(hex.substring(0, 2), 16);
            g = parseInt(hex.substring(2, 4), 16);
            b = parseInt(hex.substring(4, 6), 16);
        }
        const brightness = (r * 299 + g * 587 + b * 114) / 1000;
        loginButtonStyle.color = brightness > 125 ? '#000000' : '#FFFFFF';
    } else {
        loginButtonStyle.color = '#FFFFFF'; 
    }
  }


  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      {/* Left Column: Form */}
      <div 
        className="w-full md:w-1/2 lg:w-[45%] xl:w-2/5 flex flex-col items-center justify-center p-6 sm:p-10"
        style={leftPanelStyle}
      >
        <div className="w-full max-w-md">
            <div className="text-center">
                {currentLogoUrl ? (
                <div className="mb-4 flex justify-center">
                    <Image
                    src={currentLogoUrl}
                    alt="Logo Zaldi Imo"
                    width={84} 
                    height={28} 
                    priority
                    className="max-h-[28px] w-auto"
                    data-ai-hint="company login logo"
                    />
                </div>
                ) : (
                <h1 className="text-2xl font-bold mb-2 mt-4">Zaldi Imo</h1>
                )}
                <p className="text-muted-foreground text-[18px] mb-8" style={descriptionStyle}>Seja bem vindo ao Zaldi Imo</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                    <Label htmlFor="email" style={labelStyle}>E-mail</Label>
                    <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={isLoading}
                    style={inputStyle}
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="password" style={labelStyle}>Senha</Label>
                    <Input
                    id="password"
                    type="password"
                    placeholder="********"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={isLoading}
                    style={inputStyle}
                    />
                </div>
                <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={isLoading}
                    style={loginButtonStyle}
                >
                    {isLoading ? 'Entrando...' : 'Entrar'}
                </Button>
            </form>
            <p className="mt-8 text-xs text-center text-muted-foreground">
            Administrador: admin@zaldi.com / password<br/>
            Cliente (teste): cliente@empresa.com / cliente123
            </p>
        </div>
      </div>

      {/* Right Column: Visual Area */}
      <div
        className="hidden md:flex md:w-1/2 lg:w-[55%] xl:w-3/5 items-center justify-center relative overflow-hidden bg-muted/40" 
        style={rightPanelStyle}
      >
        {!currentBackgroundImageUrl && (
          <Image
            src="https://placehold.co/1000x1200.png" 
            alt="Painel de login"
            layout="fill"
            objectFit="cover"
            priority
            data-ai-hint="abstract background"
          />
        )}
      </div>
    </div>
  );
}

