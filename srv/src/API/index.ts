import Express from 'express';
import CONFIG from '../config';

import { Classificator } from '../Classificator';
import { Logger } from '../Logger';
import { LogLevel, LogTags } from '../Logger/types';
import { QueuesManager } from '../QueuesManager';
import { Scanner } from '../Scanner';
import { StorageType } from '../Storage';
import { Streamer } from '../Streamer';

import { gen as genScannerRoutes } from './routes/scanner';
import { gen as genLoggerRoutes } from './routes/logger';
import { gen as genClassificatorRoutes } from './routes/classificator';
import { gen as genQueuesManagerRoutes } from './routes/queuesManager';

/**
 * Класс гигачад
 */
export class API {
  router: Express.Application;

  constructor(
    private db: StorageType,
    private logger: Logger,
    private scanner: Scanner,
    private classificator: Classificator,
    private queuesManager: QueuesManager,
    private streamer: Streamer,
  ) {
    this.router = Express();
    this.router.use(Express.json());
  }

  bindRoutes(): API {
    genLoggerRoutes(this.router, this.logger);
    genClassificatorRoutes(this.logger, this.router, this.classificator);
    genQueuesManagerRoutes(this.logger, this.router, this.queuesManager, this.streamer, this.db, this.scanner);
    genScannerRoutes(this.logger, this.router, this.scanner);

    return this;
  }

  start(): void {
    this.router.listen(CONFIG.API_LISTEN_PORT, () => this.logger.log({
      message: `Server start listening on ${CONFIG.API_LISTEN_PORT}`,
      level: LogLevel.INFO,
      tags: [LogTags.APP],
    }));
  }
}

// post /api/test
// post /api/queue/stream
// get /api/queue
// get /api/queues
// post /api/createQueue
// post /api/addInQueue
// get /api/items
// get /api/items/chain
// get /api/categories
// get /api/completed
// post /api/add
// post /api/update_cats
// get /api/fileinfo
// get /api/files
// get /api/file