import "dotenv/config";
import { startApiServer } from "./api/server";
import { startSyncWorker } from "./jobs/worker-sync";
import { startReminderWorker } from "./jobs/worker-reminder";

startApiServer();
startSyncWorker();
startReminderWorker(1);
startReminderWorker(2);
startReminderWorker(3);
