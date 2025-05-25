
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { SettingsIcon, Layers } from "lucide-react"; // Adicionado Layers para categorias

export default function SettingsPage() {
  return (
    <div className="container mx-auto py-10 space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Configurações</h1>
        <p className="text-muted-foreground">Gerencie as configurações gerais da aplicação e as regras de negócio.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-xl">
              <Layers className="mr-2 h-5 w-5" />
              Gerenciar Categorias
            </CardTitle>
            <CardDescription>
              Defina e gerencie as categorias de ativos e suas respectivas regras de depreciação.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Esta seção permitirá o cadastro de categorias de ativos (ex: Eletrônicos, Veículos, Móveis)
              e a configuração das taxas e métodos de depreciação para cada uma.
            </p>
            <Button variant="outline" disabled>
              <SettingsIcon className="mr-2 h-4 w-4" />
              Configurar Categorias (Em Breve)
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-xl">
              <SettingsIcon className="mr-2 h-5 w-5" />
              Outras Configurações
            </CardTitle>
            <CardDescription>
              Opções gerais da aplicação.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Outras opções de configuração da aplicação estarão disponíveis aqui.
            </p>
            <Button variant="outline" disabled>
              Acessar (Em Breve)
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
