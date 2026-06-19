import "dotenv/config";
import { startApiServer } from "./api/server";
import { startSyncWorker } from "./jobs/worker-sync";
import { startReminderWorker } from "./jobs/worker-reminder";
import { startClientSyncWorker } from "./jobs/worker-client-sync";

startApiServer();
startSyncWorker();
startClientSyncWorker();
startReminderWorker(1);
startReminderWorker(2);
startReminderWorker(3);
