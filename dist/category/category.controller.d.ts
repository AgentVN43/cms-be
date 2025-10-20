import { CategoryService } from './category.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { Category } from './entities/category.entity';
export declare class CategoryController {
    private readonly categoryService;
    constructor(categoryService: CategoryService);
    create(createCategoryDto: CreateCategoryDto, req: any): Promise<Category>;
    findAll(): Promise<Category[]>;
    getCategory(id: string): Promise<Category>;
    updateCategory(id: string, update: UpdateCategoryDto): Promise<Category>;
    deleteCategory(id: string): Promise<{
        message: string;
    }>;
}
