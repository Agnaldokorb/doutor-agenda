"use client";

import {
  DatabaseIcon,
  DownloadIcon,
  UploadIcon,
  ClockIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const DatabaseBackupCard = () => {
  return (
    <Card className="border-indigo-200 bg-indigo-50">
      <CardHeader>
        <div className="flex items-center space-x-2">
          <DatabaseIcon className="h-5 w-5 text-indigo-600" />
          <CardTitle className="text-indigo-900">Backup e Dados</CardTitle>
        </div>
        <CardDescription className="text-indigo-700">
          Gerencie backups e exportação de dados
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="rounded-lg border border-indigo-200 bg-white p-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <ClockIcon className="h-4 w-4 text-indigo-600" />
                  <span className="text-sm font-medium text-gray-900">
                    Último backup
                  </span>
                </div>
                <span className="text-sm font-medium text-indigo-600">
                  Hoje às 03:00
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <DatabaseIcon className="h-4 w-4 text-indigo-600" />
                  <span className="text-sm font-medium text-gray-900">
                    Tamanho do banco
                  </span>
                </div>
                <span className="text-sm font-medium text-indigo-600">
                  45.2 MB
                </span>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              className="border-indigo-200 text-indigo-700 hover:bg-indigo-100"
            >
              <DownloadIcon className="mr-1 h-3 w-3" />
              Backup
            </Button>
            <Button
              variant="outline"
              className="border-indigo-200 text-indigo-700 hover:bg-indigo-100"
            >
              <UploadIcon className="mr-1 h-3 w-3" />
              Restaurar
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
