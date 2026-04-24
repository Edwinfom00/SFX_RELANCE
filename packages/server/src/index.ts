import "dotenv/config";
import { startWorker } from "./jobs/worker";
import { startApiServer } from "./api/server";

startApiServer();
startWorker();
