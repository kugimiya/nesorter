import { Storage } from './src/Storage';
import { Logger } from './src/Logger';
import { Scanner } from './src/Scanner';
import { Classificator } from './src/Classificator';
import { QueuesManager } from './src/QueuesManager';
import { Streamer } from './src/Streamer';
import { API } from './src/API';

const logger = new Logger(Storage);
const scanner = new Scanner(Storage, logger);
const classificator = new Classificator(Storage, logger);
const queuesManager = new QueuesManager(Storage, logger);
const streamer = new Streamer(logger);

const api = new API(Storage, logger, scanner, classificator, queuesManager, streamer);
api.bindRoutes().start();

export default { api };
