export interface DashboardStats {
  totalActive: number;
  totalCompleted: number;  // client a répondu (disparu de BrainOpx)
  totalClosed: number;     // 3 relances envoyées sans réponse
  totalCancelled: number;
  emailsSentToday: number;
  emailsFailed: number;
  pendingReminders: number;
}
