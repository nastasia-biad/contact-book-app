export interface IGroup {
    id: string;
    name: string;
    createdAt: number;
    contactCount: number;
}

export class Group implements IGroup {
    public id: string;
    public name: string;
    public createdAt: number;
    public contactCount: number;

    constructor(name: string) {
        this.id = this.generateId();
        this.name = this.validateName(name);
        this.createdAt = Date.now();
        this.contactCount = 0;
    }

    private generateId(): string {
        return 'group_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
    }

    private validateName(name: string): string {
        const trimmedName = name.trim();

        if (!trimmedName) {
            throw new Error('Название группы не может быть пустым');
        }

        if (trimmedName.length > 50) {
            throw new Error('Название группы не может превышать 50 символов');
        }

        return trimmedName;
    }

    update(name: string): void {
        this.name = this.validateName(name);
    }

    incrementContactCount(): void {
        this.contactCount++;
    }

    decrementContactCount(): void {
        if (this.contactCount > 0) {
            this.contactCount--;
        }
    }

    static createFromData(data: IGroup): Group {
        const group = new Group(data.name);
        group.id = data.id;
        group.createdAt = data.createdAt || Date.now();
        group.contactCount = data.contactCount || 0;
        return group;
    }

    static isValid(data: unknown): data is IGroup {
        if (typeof data !== 'object' || data === null) {
            return false;
        }

        const group = data as IGroup;

        return (
            typeof group.id === 'string' &&
            typeof group.name === 'string' &&
            (typeof group.createdAt === 'number' || group.createdAt === undefined) &&
            (typeof group.contactCount === 'number' || group.contactCount === undefined)
        );
    }

    static isNameUnique(name: string, groups: Group[], excludeId?: string): boolean {
        const trimmedName = name.trim().toLowerCase();
        return !groups.some(group =>
            (excludeId ? group.id !== excludeId : true) &&
            group.name.toLowerCase() === trimmedName
        );
    }


    static validateName(name: string, groups: Group[], excludeId?: string): string | null {
        try {
            new Group(name);

            if (!this.isNameUnique(name, groups, excludeId)) {
                return 'Группа с таким названием уже существует';
            }

            return null;
        } catch (error) {
            if (error instanceof Error) {
                return error.message;
            }
            return 'Ошибка валидации названия группы';
        }
    }

    static compare(a: Group, b: Group): number {
        return a.name.localeCompare(b.name, 'ru', { sensitivity: 'base' });
    }

    isEmpty(): boolean {
        return this.contactCount === 0;
    }

    getDisplayName(): string {
        return this.name;
    }
}