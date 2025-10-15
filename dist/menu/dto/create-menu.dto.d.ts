export declare enum MenuStatus {
    Draft = "draft",
    Published = "published",
    Archived = "archived"
}
export declare enum MenuType {
    Post = "post",
    Page = "page",
    Custom = "custom"
}
export declare class CreateMenuDto {
    label: string;
    type: MenuType;
    slug?: string;
    targetId?: string;
    url?: string;
    icon?: string;
    order?: number;
    parentId?: string | null;
    visibleRoles?: string[];
    status?: MenuStatus;
    publishedAt?: number | null;
}
