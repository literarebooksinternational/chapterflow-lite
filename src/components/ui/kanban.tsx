// src/components/ui/kanban.tsx

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

// Define o tipo de uma tarefa. Isso ajuda a evitar erros e melhora o autocompletar.
// Corresponde à estrutura do seu 'mockTasks' no AdminDashboard.
export type Task = {
  id: number;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low' | string; // string para flexibilidade
  status: 'todo' | 'in_progress' | 'done' | string; // string para flexibilidade
};

interface KanbanProps {
  tasks: Task[];
  // Incluí setTasks aqui para o futuro, caso você queira implementar drag-and-drop
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
}

/**
 * Componente TaskCard: Renderiza um único cartão de tarefa.
 */
const TaskCard = ({ task }: { task: Task }) => {
  // Define a cor do badge com base na prioridade da tarefa
  const getPriorityVariant = (priority: typeof task.priority): 'destructive' | 'secondary' | 'outline' => {
    switch (priority) {
      case 'high':
        return 'destructive';
      case 'medium':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  return (
    <Card className="mb-4 bg-background border-glass-border cursor-grab active:cursor-grabbing">
      <CardContent className="p-4">
        <h4 className="font-semibold text-white">{task.title}</h4>
        <p className="text-sm text-muted-foreground mt-1">{task.description}</p>
        <Badge 
          variant={getPriorityVariant(task.priority)}
          className="mt-3 text-xs"
        >
          Prioridade: {task.priority}
        </Badge>
      </CardContent>
    </Card>
  );
};

/**
 * Componente KanbanColumn: Renderiza uma coluna do quadro Kanban (ex: "A Fazer").
 */
const KanbanColumn = ({ title, tasks }: { title: string; tasks: Task[] }) => (
  <div className="flex-1 p-4 bg-card/50 rounded-lg border border-glass-border min-h-[300px]">
    <h3 className="text-lg font-bold text-editorial mb-4 px-1">{title}</h3>
    <div className="h-full">
      {tasks.length > 0 ? (
        tasks.map(task => <TaskCard key={task.id} task={task} />)
      ) : (
        <div className="flex items-center justify-center h-full">
            <p className="text-sm text-muted-foreground">Nenhuma tarefa aqui.</p>
        </div>
      )}
    </div>
  </div>
);

/**
 * Componente Kanban: O quadro principal que organiza as tarefas em colunas.
 */
export const Kanban = ({ tasks, setTasks }: KanbanProps) => {
  // Filtra as tarefas para cada coluna com base no status
  const todoTasks = tasks.filter(task => task.status === 'todo');
  const inProgressTasks = tasks.filter(task => task.status === 'in_progress');
  const doneTasks = tasks.filter(task => task.status === 'done');

  // Adicionar a lógica de arrastar e soltar (drag and drop) aqui no futuro, se necessário.
  // Para isso, você pode usar bibliotecas como 'react-beautiful-dnd' ou 'dnd-kit'.

  return (
    <div className="flex flex-col md:flex-row gap-4 w-full">
      <KanbanColumn title="A Fazer" tasks={todoTasks} />
      <KanbanColumn title="Em Progresso" tasks={inProgressTasks} />
      <KanbanColumn title="Concluído" tasks={doneTasks} />
    </div>
  );
};