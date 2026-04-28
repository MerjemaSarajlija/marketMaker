import { HttpService } from '@nestjs/axios';
import { TopOfBook } from '../types';
export declare class BinanceDemoClient {
    private readonly http;
    private readonly logger;
    private readonly baseUrl;
    constructor(http: HttpService);
    getTopOfBook(symbol: string): Promise<TopOfBook>;
}
