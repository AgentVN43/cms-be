import { MenuStatus } from './create-menu.dto';
export declare class QueryMenuDto {
    q?: string;
    parentId?: string;
    status?: MenuStatus;
    page?: number;
    limit?: number;
    sort?: string;
}
