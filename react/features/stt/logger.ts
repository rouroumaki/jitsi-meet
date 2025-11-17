import { getLogger } from '../base/logging/functions';

/**
 * Logger interface with common logging methods.
 */
interface ILogger {
    debug: (...args: any[]) => void;
    error: (...args: any[]) => void;
    info: (...args: any[]) => void;
    warn: (...args: any[]) => void;
}

const logger = getLogger('features/stt') as unknown as ILogger;

export default logger;

