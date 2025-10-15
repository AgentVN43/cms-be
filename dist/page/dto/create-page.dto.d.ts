export declare enum PageStatus {
    Draft = "draft",
    Published = "published",
    Archived = "archived"
}
export declare class CreatePageDto {
    title: string;
    slug?: string;
    content: string;
    parentId?: string | null;
    order?: number;
    status?: PageStatus;
    showInSitemap?: boolean;
    publishedAt?: string;
}
