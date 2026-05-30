import { config } from "./config";
import logger from "./utils/logger";
import app from "./app";

app.listen(config.port, () => {
  logger.info(`Server is running on port ${config.port}`);
});
