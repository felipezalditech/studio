
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Palette } from "lucide-react"; // Alterado de Settings para Palette

export default function AdminPersonalizationPage() { // Nome da função alterado
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Personalização do Sistema</h1> {/* Título alterado */}
          <p className="text-muted-foreground">
            Customize a aparência da tela de login e outros elementos visuais.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Palette className="mr-2 h-5 w-5 text-primary" /> {/* Ícone alterado */}
            Configurações de Aparência
          </CardTitle>
          <CardDescription>
            Modifique os elementos visuais da tela de login para alinhar com sua marca.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold">Logo na Tela de Login</h3>
              <p className="text-muted-foreground">
                Faça o upload do logo da sua empresa que será exibido na tela de login.
              </p>
              {/* Placeholder para input de logo */}
            </div>
            <div>
              <h3 className="text-lg font-semibold">Imagem de Fundo da Tela de Login</h3>
              <p className="text-muted-foreground">
                Escolha uma imagem de fundo para a página de login.
              </p>
              {/* Placeholder para input de imagem de fundo */}
            </div>
            <div>
              <h3 className="text-lg font-semibold">Cores do Botão de Login</h3>
              <p className="text-muted-foreground">
                Personalize as cores do botão principal da tela de login.
              </p>
              {/* Placeholder para seletores de cor */}
            </div>
            <p className="text-sm text-muted-foreground pt-4">
              As funcionalidades de personalização ainda estão em desenvolvimento.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
